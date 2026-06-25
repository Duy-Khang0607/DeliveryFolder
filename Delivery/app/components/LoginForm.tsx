'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react';
import ForgotPassword from './ForgotPassword';
import LoginDetails from './LoginDetails';


const LoginForm = () => {
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center text-center relative">
            <div className='relative w-full h-full max-w-md overflow-hidden'>
                <AnimatePresence mode='wait'>
                    {isForgotPassword ? (
                        <motion.div
                            key="forgot"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                        >
                            <ForgotPassword onBack={() => setIsForgotPassword(false)} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="login"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                        >
                            <LoginDetails onBack={() => setIsForgotPassword(true)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LoginForm;