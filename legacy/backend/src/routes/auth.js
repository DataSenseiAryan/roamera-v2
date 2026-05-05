const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const prisma  = require('../lib/prisma');
const { sendVerificationEmail } = require('../lib/mailer');

const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });
  if (!USERNAME_RE.test(username))
    return res.status(400).json({ error: 'Username must be 3–30 characters: letters, numbers, underscores only' });
  if (!EMAIL_RE.test(email))
    return res.status(400).json({ error: 'Enter a valid email address' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (exists) return res.status(409).json({ error: 'Username or email already taken' });

  const hashed = await bcrypt.hash(password, 10);
  const verificationToken = genToken();
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: { username, email, password: hashed, verificationToken, verificationTokenExpiry },
    select: { id: true, username: true, email: true, emailVerified: true, createdAt: true },
  });

  await sendVerificationEmail(email, verificationToken);

  res.status(201).json({ user, requiresVerification: true });
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const user = await prisma.user.findFirst({
    where: { verificationToken: token, verificationTokenExpiry: { gt: new Date() } },
  });
  if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null, verificationTokenExpiry: null },
  });

  const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safe } = user;
  res.json({ user: { ...safe, emailVerified: true }, token: jwtToken });
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(200).json({ message: 'If that email exists, a link was sent.' });
  if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

  const verificationToken = genToken();
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.user.update({ where: { id: user.id }, data: { verificationToken, verificationTokenExpiry } });
  await sendVerificationEmail(email, verificationToken);

  res.json({ message: 'Verification email sent' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email/username and password are required' });

  const user = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: email }] },
  });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  if (!user.emailVerified)
    return res.status(403).json({ error: 'Please verify your email before logging in.', requiresVerification: true, email: user.email });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const { password: _, verificationToken: __, verificationTokenExpiry: ___, ...userWithoutSecrets } = user;
  res.json({ user: userWithoutSecrets, token });
});

module.exports = router;
