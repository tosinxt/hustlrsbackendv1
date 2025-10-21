const supabase = require('../config/supabase');

class AuthService {
  // Sign up a new user
  async signUp(email, password, userData) {
    try {
      console.log('Starting user signup for:', email);
      
      // First, create the auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            user_type: userData.userType
          },
          // Don't try to create the profile here, we'll handle it in the trigger
          emailRedirectTo: process.env.SUPABASE_REDIRECT_URL || 'http://localhost:3000/auth/callback'
        }
      });

      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        throw signUpError;
      }

      console.log('Auth user created:', authData.user?.id);
      
      // The profile will be created by the database trigger
      // We'll just return the auth data for now
      return {
        success: true,
        data: {
          user: authData.user,
          session: authData.session
        },
        message: 'Signup successful! Please check your email to verify your account.'
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign up user'
      };
    }
  }

  // Sign in a user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in'
      };
    }
  }

  // Sign out the current user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign out'
      };
    }
  }

  // Get the current user session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      return {
        success: true,
        data: { session }
      };
    } catch (error) {
      console.error('Get session error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get session'
      };
    }
  }

  // Get the current user
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      return {
        success: true,
        data: { user }
      };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user'
      };
    }
  }

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  }

  // Request password reset
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/update-password',
      });

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send password reset email'
      };
    }
  }
}

module.exports = new AuthService();
