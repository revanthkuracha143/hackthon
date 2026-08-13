# Broken Express API Example

This directory contains a sample Node.js + Express API used to demonstrate **API Doctor**.

## The Bug

The API exposes a GET route to retrieve a user by ID: `GET /api/users/:id`.

In `routes/users.js`, the route is defined as:
```javascript
router.get('/:id', userController.getUserById);
```

In `controllers/userController.js`, the handler incorrectly reads `req.params.userID` instead of `req.params.id`:
```javascript
const id = req.params.userID; // BUG: req.params.userID is undefined!
```

When a request is sent to `GET /api/users/1`, `req.params.userID` evaluates to `undefined`, triggering a 500 Internal Server Error.

## How API Doctor Repairs It

1. API Doctor extracts and runs this project in an isolated workspace.
2. It executes `GET /api/users/1` and captures the 500 HTTP response & stack trace.
3. The AI service analyzes the stack trace and route definitions, identifying `controllers/userController.js` line 13.
4. AI generates the patch: `const id = req.params.id;`
5. API Doctor applies the fix to a temporary copy, restarts the server, and verifies `GET /api/users/1` returns `200 OK`.
