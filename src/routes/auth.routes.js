const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const { body, validationResult } = require('express-validator');

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
  '/signup',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('userType', 'User type is required').isIn(['CUSTOMER', 'HUSTLER']),
    validate
  ],
  async (req, res) => {
    try {
      console.log('Signup request received:', { email: req.body.email });
      const { email, password, firstName, lastName, userType } = req.body;
      
      // Input validation
      if (!email || !password || !firstName || !lastName || !userType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const result = await authService.signUp(email, password, {
        firstName,
        lastName,
        userType
      });

      if (!result.success) {
        console.error('Signup failed:', result.error);
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to create user account',
          details: result.details
        });
      }

      console.log('Signup successful for user:', result.data.user?.id);
      
      // Don't send sensitive data in the response
      const { user, session } = result.data;
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        userType: userType,
        isVerified: user.email_confirmed_at != null
      };

      res.status(201).json({
        success: true,
        message: result.message || 'User registered successfully',
        data: {
          user: userResponse,
          session: session ? {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: session.expires_in,
            token_type: session.token_type
          } : null
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error during signup',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// @route   POST /api/auth/signin
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/signin',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
    validate
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const result = await authService.signIn(email, password);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'User logged in successfully',
        data: {
          user: result.data.user,
          session: result.data.session
        }
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error during signin'
      });
    }
  }
);

// @route   POST /api/auth/signout
// @desc    Logout user / clear session
// @access  Private
router.post('/signout', async (req, res) => {
  try {
    const result = await authService.signOut();
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during signout'
    });
  }
});

// @route   GET /api/auth/session
// @desc    Get current user session
// @access  Private
router.get('/session', async (req, res) => {
  try {
    const result = await authService.getSession();
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while getting session'
    });
  }
});

// @route   GET /api/auth/user
// @desc    Get current user data
// @access  Private
router.get('/user', async (req, res) => {
  try {
    const result = await authService.getUser();
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while getting user data'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Request password reset
// @access  Public
router.post(
  '/reset-password',
  [
    body('email', 'Please include a valid email').isEmail(),
    validate
  ],
  async (req, res) => {
    try {
      const { email } = req.body;
      
      const result = await authService.resetPassword(email);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error while processing password reset'
      });
    }
  }
);

module.exports = router;
