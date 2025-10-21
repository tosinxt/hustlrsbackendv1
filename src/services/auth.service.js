const supabase = require('../config/supabase');

class AuthService {
  // Sign up a new user
  async signUp(email, password, userData) {
    try {
      console.log('🚀 Starting user signup for:', email);
      
      // 1. First, create the auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            user_type: userData.userType
          },
          emailRedirectTo: process.env.SUPABASE_REDIRECT_URL || 'http://localhost:3000/auth/callback'
        }
      });

      if (signUpError) {
        console.error('❌ Auth signup error:', signUpError);
        // Handle specific error cases
        if (signUpError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw signUpError;
      }

      console.log('✅ Auth user created:', authData.user?.id);
      
      // 2. Get the newly created user
      const { data: { user }, error: userError } = await supabase.auth.getUser(authData.user.id);
      
      if (userError) {
        console.error('❌ Error fetching user after signup:', userError);
        throw userError;
      }

      // 3. Check if the profile was created by the trigger
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.warn('⚠️ Profile not created by trigger, creating manually...');
        // If the trigger didn't work, create the profile manually
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              first_name: userData.firstName,
              last_name: userData.lastName,
              user_type: userData.userType
            }
          ])
          .select()
          .single();

        if (createProfileError) {
          console.error('❌ Error creating profile:', createProfileError);
          throw createProfileError;
        }

        console.log('✅ Profile created manually:', newProfile);
      } else {
        console.log('✅ Profile exists:', profile);
      }

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
