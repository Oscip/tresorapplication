import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {postUser} from "../../comunication/FetchUser";

/**
 * RegisterUser
 * @author Peter Rutschmann
 */
function RegisterUser({loginValues, setLoginValues}) {
    const navigate = useNavigate();

    const initialState = {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        passwordConfirmation: "",
        errorMessage: ""
    };
    const [credentials, setCredentials] = useState(initialState);
    const [errorMessage, setErrorMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState("");

    const commonPasswords = ["123456", "password", "12345678", "qwerty", "abc123"];

    function checkStrength(password) {
        let passed = 0;

        // Länge
        if (/^.{8,20}$/.test(password)) passed++;
        // Kleinbuchstaben
        if (/[a-z]/.test(password)) passed++;
        // Großbuchstaben
        if (/[A-Z]/.test(password)) passed++;
        // Zahl
        if (/[0-9]/.test(password)) passed++;
        // Sonderzeichen
        if (/[@#$%^&+=!?.]/.test(password)) passed++;
        // Häufige Passwörter ausschließen
        if (!commonPasswords.includes(password.toLowerCase())) passed++;

        // Prozentualer Score
        const percentage = Math.round((passed / 6) * 100);

        // Rückgabe in Kategorien
        if (percentage === 100) return "strong";
        if (percentage >= 70) return "medium";
        return "weak";
    }


    const handlePasswordChange = (e) => {
        const pw = e.target.value;

        // update password
        setCredentials(prev => ({...prev, password: pw}));

        // evaluate password strength
        setPasswordStrength(checkStrength(pw));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        //validate
        if (credentials.password !== credentials.passwordConfirmation) {
            console.log("password != passwordConfirmation");
            setErrorMessage('Password and password-confirmation are not equal.');
            return;
        }

        // validate strength
        if (passwordStrength !== "strong") {
            setErrorMessage("Password is too weak. Please follow the password rules.");
            return;
        }

        try {
            await postUser(credentials);
            setLoginValues({userName: credentials.email, password: credentials.password});
            setCredentials(initialState);
            navigate('/');
        } catch (error) {
            console.error('Failed to fetch to server:', error.message);
            setErrorMessage(error.message);
        }
    };

    return (
        <div>
            <h2>Register user</h2>
            <form onSubmit={handleSubmit}>
                <section>
                    <aside>
                        <div>
                            <label>Firstname:</label>
                            <input
                                type="text"
                                value={credentials.firstName}
                                onChange={(e) =>
                                    setCredentials(prevValues => ({...prevValues, firstName: e.target.value}))}
                                required
                                placeholder="Please enter your firstname *"
                            />
                        </div>
                        <div>
                            <label>Lastname:</label>
                            <input
                                type="text"
                                value={credentials.lastName}
                                onChange={(e) =>
                                    setCredentials(prevValues => ({...prevValues, lastName: e.target.value}))}
                                required
                                placeholder="Please enter your lastname *"
                            />
                        </div>
                        <div>
                            <label>Email:</label>
                            <input
                                type="text"
                                value={credentials.email}
                                onChange={(e) =>
                                    setCredentials(prevValues => ({...prevValues, email: e.target.value}))}
                                required
                                placeholder="Please enter your email"
                            />
                        </div>
                    </aside>
                    <aside>
                        <div>
                            <label>Password:</label>
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={handlePasswordChange}
                                required
                                placeholder="Please enter your pwd *"
                            />

                            {/* Password strength indicator */}
                            {credentials.password && (
                                <p style={{
                                    color:
                                        passwordStrength === "strong"
                                            ? "green"
                                            : passwordStrength === "medium"
                                                ? "orange"
                                                : "red"
                                }}>
                                    Strength: {passwordStrength}
                                </p>
                            )}
                        </div>
                        <div>
                            <label>Password confirmation:</label>
                            <input
                                type="text"
                                value={credentials.passwordConfirmation}
                                onChange={(e) =>
                                    setCredentials(prevValues => ({
                                        ...prevValues,
                                        passwordConfirmation: e.target.value
                                    }))}
                                required
                                placeholder="Please confirm your pwd *"
                            />
                        </div>
                    </aside>
                </section>
                <button type="submit">Register</button>
                {errorMessage && <p style={{color: 'red'}}>{errorMessage}</p>}
            </form>
        </div>
    );
}

export default RegisterUser;
