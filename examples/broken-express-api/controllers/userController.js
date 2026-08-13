const users = [
  { id: '1', name: 'Alice Smith', email: 'alice@example.com', role: 'Developer' },
  { id: '2', name: 'Bob Jones', email: 'bob@example.com', role: 'Designer' }
];

exports.getAllUsers = (req, res) => {
  res.json({ success: true, count: users.length, data: users });
};

exports.getUserById = (req, res, next) => {
  try {
    // INTENTIONAL BUG: The route parameter defined in routes/users.js is :id
    // But this controller accesses req.params.userID which is undefined!
    const id = req.params.userID;

    if (!id) {
      // Causes 500 error due to missing required parameter parameter bug
      throw new Error('User ID is required but req.params.userID was undefined');
    }

    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
