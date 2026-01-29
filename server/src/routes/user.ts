import { Router, Request, Response, NextFunction } from 'express';
import { 
  registerUser, 
  getUserByEmail, 
  loginUser, 
  getAllUsers, 
  updateUser, 
  deleteUser 
} from '../controllers/userController';

const router = Router();

// Validation middleware
const validateEmail = (req: Request, res: Response, next: NextFunction) => {
  const email = req.body.email || req.params.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid email is required' 
    });
  }
  next();
};

const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password are required' 
    });
  }
  
  if (typeof password !== 'string' || password.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid password is required' 
    });
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid email format is required' 
    });
  }
  
  next();
};

const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, username } = req.body;
  
  if (!email || !password || !username) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email, password, and username are required' 
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      error: 'Password must be at least 6 characters' 
    });
  }
  
  next();
};

const validateId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Valid user ID is required' 
    });
  }
  req.params.id = id.toString();
  next();
};

// Async error wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Register a new user
router.post('/register', validateRegistration, validateEmail, asyncHandler(registerUser));

// Login a user
router.post('/login', validateLogin, asyncHandler(loginUser));

// Get all users (should be protected in production)
router.get('/', asyncHandler(getAllUsers));

// Get user by email
router.get('/:email', validateEmail, asyncHandler(getUserByEmail));

// Update a user
router.put('/:id', validateId, asyncHandler(updateUser));

// Delete a user
router.delete('/:id', validateId, asyncHandler(deleteUser));

export default router;

