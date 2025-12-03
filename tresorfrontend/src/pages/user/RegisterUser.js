import React, {useState, useRef} from 'react'; // useRef hinzugefügt
import {useNavigate} from 'react-router-dom';
import {postUser} from "../../comunication/FetchUser";
import ReCAPTCHA from 'react-google-recaptcha'; // ⬅️ NEU: ReCAPTCHA Import

/**
 * RegisterUser
 * @author Peter Rutschmann
 */
function RegisterUser({loginValues, setLoginValues}) {
    const navigate = useNavigate();

    // ➡️ NEU: Der öffentliche Site-Key, den Sie bereitgestellt haben
    const RECAPTCHA_SITE_KEY = '6LdSwh8sAAAAACH6DGEdu_US_9jQqMnXsxCZxDUX';

    const initialState = {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        passwordConfirmation: "",
        // ➡️ NEU: Feld für den Captcha-Token im State
        recaptchaToken: "",
        errorMessage: ""
    };
    const [credentials, setCredentials] = useState(initialState);
    const [errorMessage, setErrorMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState("");

    // ➡️ NEU: Ref, um auf die Captcha-Instanz zugreifen zu können (z.B. für reset)
    const captchaRef = useRef(null);

    const commonPasswords = ["123456", "password", "12345678", "qwerty", "abc123"];

    function checkStrength(password) {
        // ... (Ihre Stärkenprüfung bleibt unverändert)
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
        // Häufige Passwörter ausschliessen
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

    // ➡️ NEU: Handler, der aufgerufen wird, wenn der User das Captcha löst
    const handleCaptchaChange = (token) => {
        setCredentials(prevValues => ({...prevValues, recaptchaToken: token}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        // ➡️ NEU: Captcha-Validierung hinzufügen
        if (!credentials.recaptchaToken) {
            setErrorMessage('Bitte bestätigen Sie, dass Sie kein Roboter sind.');
            return;
        }

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
            // Das Credentials-Objekt enthält nun automatisch den recaptchaToken
            await postUser(credentials);

            // Bei Erfolg:
            setLoginValues({userName: credentials.email, password: credentials.password});
            setCredentials(initialState);

            // ➡️ NEU: Captcha zurücksetzen, um es für die nächste Registrierung bereitzuhalten
            if (captchaRef.current) {
                captchaRef.current.reset();
            }

            navigate('/');
        } catch (error) {
            console.error('Failed to fetch to server:', error.message);
            setErrorMessage(error.message);

            // ➡️ NEU: Captcha zurücksetzen, falls der Backend-Call fehlschlägt
            if (captchaRef.current) {
                captchaRef.current.reset();
                setCredentials(prevValues => ({...prevValues, recaptchaToken: ""}));
            }
        }
    };

    const getStrengthPercentage = () => {
        switch(passwordStrength) {
            case "weak": return 33;
            case "medium": return 66;
            case "strong": return 100;
            default: return 0;
        }
    };

    const getStrengthColor = () => {
        switch(passwordStrength) {
            case "weak": return "red";
            case "medium": return "orange";
            case "strong": return "green";
            default: return "transparent";
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
                                <>
                                    <div style={{border: "1px solid #ccc", width: "100%", height: "10px", marginTop: "5px"}}>
                                        <div
                                            style={{
                                                width: `${getStrengthPercentage()}%`,
                                                height: "100%",
                                                backgroundColor: getStrengthColor(),
                                                transition: "width 0.3s"
                                            }}
                                        />
                                    </div>
                                    <p style={{color: getStrengthColor()}}>
                                        Strength: {passwordStrength}
                                    </p>
                                </>
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

                {/* ⬅️ NEU: ReCAPTCHA Komponente einbinden */}
                <div style={{marginTop: '20px', marginBottom: '10px'}}>
                    <ReCAPTCHA
                        ref={captchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={handleCaptchaChange}
                    />
                </div>

                <button type="submit">Register</button>
                {errorMessage && <p style={{color: 'red'}}>{errorMessage}</p>}
            </form>
        </div>
    );
}

export default RegisterUser;