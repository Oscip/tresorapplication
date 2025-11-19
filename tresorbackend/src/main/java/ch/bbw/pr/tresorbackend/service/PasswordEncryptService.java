package ch.bbw.pr.tresorbackend.service;

import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCrypt;
import java.security.SecureRandom;

/**
 * PasswordEncryptService
 * Used to hash password and verify match with Salt and Pepper
 * @author Peter Rutschmann
 */
@Service
public class PasswordEncryptService {

    // Optional Pepper (fixed secret value)
    private static final String PEPPER = "MySuperSecretPepper123!";

    public PasswordEncryptService() {
        // nothing needed in constructor
    }

    /**
     * Hash a password with Salt + Pepper using BCrypt
     */
    public String hashPassword(String password) {
        String saltedPassword = addSaltAndPepper(password);
        return BCrypt.hashpw(saltedPassword, BCrypt.gensalt(12));
    }

    /**
     * Verify if a plain password matches a hashed password
     */
    public boolean doPasswordMatch(String password, String hashedPassword) {
        String saltedPassword = addSaltAndPepper(password);
        return BCrypt.checkpw(saltedPassword, hashedPassword);
    }

    /**
     * Combine user password with Pepper
     */
    private String addSaltAndPepper(String password) {
        return password + PEPPER;
    }
}
