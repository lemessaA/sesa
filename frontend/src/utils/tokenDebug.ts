/**
 * Token Debug Utility - Check token validity
 */

export const debugToken = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    console.group('🔐 Token Debug Info');
    
    if (!token) {
        console.error('❌ No token found in localStorage');
        console.log('Solution: Login again');
        console.groupEnd();
        return { valid: false, reason: 'NO_TOKEN' };
    }

    console.log('✅ Token exists:', token.substring(0, 20) + '...');

    // Decode JWT (without verification)
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('❌ Invalid token format (not a JWT)');
            console.log('Solution: Logout and login again');
            console.groupEnd();
            return { valid: false, reason: 'INVALID_FORMAT' };
        }

        const payload = JSON.parse(atob(parts[1]));
        console.log('📦 Token Payload:', payload);

        // Check expiration
        if (payload.exp) {
            const expiresAt = new Date(payload.exp * 1000);
            const now = new Date();
            const isExpired = now > expiresAt;

            console.log('⏰ Expires at:', expiresAt.toLocaleString());
            console.log('🕐 Current time:', now.toLocaleString());
            
            if (isExpired) {
                console.error('❌ Token is EXPIRED');
                console.log('Solution: Logout and login again');
                console.groupEnd();
                return { valid: false, reason: 'EXPIRED', expiresAt };
            } else {
                const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);
                console.log(`✅ Token is valid (${minutesLeft} minutes remaining)`);
            }
        }

        // Check user data
        if (!user) {
            console.warn('⚠️ No user data in localStorage');
        } else {
            const userData = JSON.parse(user);
            console.log('👤 User:', userData);
        }

        console.log('✅ Token appears valid');
        console.groupEnd();
        return { valid: true, payload };

    } catch (err) {
        console.error('❌ Failed to decode token:', err);
        console.log('Solution: Logout and login again');
        console.groupEnd();
        return { valid: false, reason: 'DECODE_ERROR' };
    }
};

// Auto-check token on page load
if (typeof window !== 'undefined') {
    window.debugToken = debugToken;
    console.log('💡 Tip: Run debugToken() in console to check your token');
}

declare global {
    interface Window {
        debugToken: typeof debugToken;
    }
}
