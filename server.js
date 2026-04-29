const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// تخزين مؤقت في الذاكرة
const users = [];
const messages = [];

// ========== WebSocket ==========
io.on('connection', (socket) => {
  console.log('✅ مستخدم متصل');

  socket.on('user_join', (username) => {
    users.push({ id: socket.id, username });
    io.emit('users_count', users.length);
  });

  socket.on('send_message', (data) => {
    const msg = {
      id: Date.now().toString(),
      sender: data.sender,
      text: data.text,
      time: new Date().toLocaleString('ar-EG')
    };
    messages.push(msg);
    io.emit('new_message', msg);
  });

  socket.on('disconnect', () => {
    const index = users.findIndex(u => u.id === socket.id);
    if (index > -1) users.splice(index, 1);
    io.emit('users_count', users.length);
  });
});

// ========== REST API ==========
app.get('/', (req, res) => {
  res.json({
    app: '🔥 VolixChat',
    status: 'Online',
    version: '1.0.0',
    users: users.length,
    messages: messages.length
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'البريد وكلمة المرور مطلوبان' 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'كلمة المرور 8 أحرف على الأقل'
    });
  }

  res.json({
    success: true,
    message: '🛡️ تم الدخول بنجاح',
    token: 'jwt_' + Date.now().toString(36),
    user: { email }
  });
});

app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'كل الحقول مطلوبة'
    });
  }

  res.json({
    success: true,
    message: '🎉 تم إنشاء الحساب بنجاح',
    token: 'jwt_' + Date.now().toString(36),
    user: { username, email }
  });
});

// ========== تشغيل السيرفر ==========
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log('🚀 VolixChat Server on port ' + PORT);
});