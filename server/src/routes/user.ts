import { Router } from 'express';
import { 
  registerUser, 
  getUserByEmail, 
  loginUser, 
  getAllUsers, 
  updateUser, 
  deleteUser 
} from '../controllers/userController';

const router = Router();

// Register a new user
router.post('/register', registerUser);

// Login a user
router.post('/login', loginUser);

// Get all users
router.get('/', getAllUsers);

// Get user by email
router.get('/:email', getUserByEmail);

// Update a user
router.put('/:id', updateUser);

// Delete a user
router.delete('/:id', deleteUser);

export default router;

