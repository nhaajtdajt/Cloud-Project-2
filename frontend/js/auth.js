// ============================================================
// AUTH.JS — Xác thực người dùng với Amazon Cognito
// Sử dụng amazon-cognito-identity-js SDK
// ============================================================

// Khởi tạo Cognito User Pool
const poolData = {
    UserPoolId: CONFIG.COGNITO.USER_POOL_ID,
    ClientId: CONFIG.COGNITO.APP_CLIENT_ID
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// ============================================================
// ĐĂNG KÝ (Sign Up)
// ============================================================
function signUp(email, password) {
    return new Promise((resolve, reject) => {
        const attributeList = [
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: 'email',
                Value: email
            })
        ];

        userPool.signUp(email, password, attributeList, null, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

// ============================================================
// XÁC NHẬN MÃ OTP (Confirm Sign Up)
// ============================================================
function confirmSignUp(email, code) {
    return new Promise((resolve, reject) => {
        const userData = {
            Username: email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.confirmRegistration(code, true, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

// ============================================================
// ĐĂNG NHẬP (Sign In)
// ============================================================
function signIn(email, password) {
    return new Promise((resolve, reject) => {
        const authenticationData = {
            Username: email,
            Password: password
        };
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        const userData = {
            Username: email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                resolve(result);
            },
            onFailure: (err) => {
                reject(err);
            },
            newPasswordRequired: (userAttributes) => {
                // Trường hợp admin tạo user phải đổi mật khẩu
                delete userAttributes.email_verified;
                delete userAttributes.email;
                cognitoUser.completeNewPasswordChallenge(password, userAttributes, {
                    onSuccess: (result) => resolve(result),
                    onFailure: (err) => reject(err)
                });
            }
        });
    });
}

// ============================================================
// ĐĂNG XUẤT (Sign Out)
// ============================================================
function signOut() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.signOut();
    }
    localStorage.removeItem('idToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
}

// ============================================================
// LẤY TOKEN
// ============================================================
function getToken() {
    return localStorage.getItem('idToken');
}

// ============================================================
// KIỂM TRA ĐÃ ĐĂNG NHẬP CHƯA
// ============================================================
function isAuthenticated() {
    const token = getToken();
    if (!token) return false;

    // Kiểm tra token hết hạn (JWT decode phần payload)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
    } catch (e) {
        return false;
    }
}

// ============================================================
// LẤY THÔNG TIN USER HIỆN TẠI
// ============================================================
function getCurrentUser() {
    return {
        email: localStorage.getItem('userEmail') || '',
        userId: localStorage.getItem('userId') || ''
    };
}

// ============================================================
// LƯU THÔNG TIN SAU ĐĂNG NHẬP
// ============================================================
function saveAuthData(authResult) {
    const idToken = authResult.getIdToken().getJwtToken();
    const payload = authResult.getIdToken().decodePayload();

    localStorage.setItem('idToken', idToken);
    localStorage.setItem('userEmail', payload.email || payload['cognito:username']);
    localStorage.setItem('userId', payload.sub);
}

// ============================================================
// BẢO VỆ TRANG — Redirect nếu chưa đăng nhập
// ============================================================
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Nếu đã đăng nhập thì redirect khỏi trang login/signup
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'index.html';
    }
}
