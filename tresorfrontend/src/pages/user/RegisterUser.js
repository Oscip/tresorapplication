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

    const checkStrength = (pw) => {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (strongRegex.test(pw)) return "strong";
        if (pw.length >= 6) return "medium";
        return "weak";
    };

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
