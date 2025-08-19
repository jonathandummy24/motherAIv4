const axios = require("axios")
const FIREBASE_API_KEY="AIzaSyC4cU3uaCXG1UYksofLTyHQps15wUpQTJY"

const {admin,auth,db}= require("../config")


async function loginUser(req,res){
      const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    // Firebase REST API login
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true
      }
    );

    const { idToken, refreshToken, expiresIn, localId } = response.data;
    const decodedToken = await auth.verifyIdToken(idToken);

    res.json({
      message: 'Login successful',
      token: idToken,
      refreshToken,
      expiresIn,
      uid: localId,
      user: decodedToken
    });

    } catch (error) {
        return res.status(500).json({"message":error.message})
        
    }
}

async function loginUserBot(email,password){
   if (!email || !password) {
    return 'Email and password are required' ;
  }
  try {
    // Firebase REST API login
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true
      }
    );

    const { idToken, refreshToken, expiresIn, localId } = response.data;
    const decodedToken = await auth.verifyIdToken(idToken);


    
    const obj= {
      message: 'Login successful',
      token: idToken,
      refreshToken,
      expiresIn,
      uid: localId,
      user: decodedToken,
         }

    
    return obj

    } catch (error) {
        return error.message
        
    }
}

async function registerUser (req,res){
    try {

    const { email, password, name,role,department } = req.body;
     if (!email.trim() || !password.trim()) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name || null,
      emailVerified: false
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      name: name || null,
      department,
      role:role,
      createdAt: new Date().toISOString(),
      isActive: true
    });

      res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: name || null
      }
    });

    } catch (error) {
         console.error('Registration error:', error);
          // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ 
        error: 'Email already exists' 
      });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ 
        error: 'Password is too weak' 
      });
    }

    res.status(500).json({ 
      error: 'Registration failed' 
    });

    }
}

async function getUserByEmailAdmin(email) {
  try {
   
    
    const userRecord = await admin.auth().getUserByEmail(email);
 
    // Then get additional user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
  
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
 
    return {
      id: userDoc.id,
      ...userData
    };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    console.error('Error getting user by email:', error);
    throw error;
  }
}


async function getUserDepartment(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    return userData.department || null;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

module.exports={registerUser,loginUser,loginUserBot,getUserDepartment}