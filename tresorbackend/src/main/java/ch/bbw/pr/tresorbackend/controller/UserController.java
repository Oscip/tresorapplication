package ch.bbw.pr.tresorbackend.controller;

import ch.bbw.pr.tresorbackend.model.*;
import ch.bbw.pr.tresorbackend.service.PasswordEncryptService;
import ch.bbw.pr.tresorbackend.service.UserService;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate; // Wird für den reCAPTCHA API Call benötigt

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * UserController
 *
 * @author Peter Rutschmann
 */
@RestController
@AllArgsConstructor // ⬅️ Erzeugt den Konstruktor für alle finalen/nicht-finalen Felder
@RequestMapping("api/users")
public class UserController {

    // Diese Felder werden durch @AllArgsConstructor im Konstruktor injiziert
    private final UserService userService;
    private final PasswordEncryptService passwordService;
    private final RecaptchaService recaptchaService; // 🚀 Hinzugefügter Service

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    // ⚠️ HINWEIS: Der manuelle Konstruktor wurde entfernt, um den Kompilierungsfehler zu beheben.
    // Die Injektion erfolgt nun automatisch über @AllArgsConstructor.

    // build create User REST API
    @CrossOrigin(origins = "${CROSS_ORIGIN}")
    @PostMapping
    public ResponseEntity<String> createUser(@Valid @RequestBody RegisterUser registerUser, BindingResult bindingResult) {

        // 1. CAPTCHA PRÜFUNG: Token aus dem Request holen
        String recaptchaToken = registerUser.getRecaptchaToken();

        if (recaptchaToken == null || recaptchaToken.isEmpty()) {
            logger.warn("UserController.createUser: Missing recaptchaToken");
            return ResponseEntity.badRequest().body("{\"message\":\"Missing reCAPTCHA token.\"}");
        }

        // 🚀 Verifizierung des Tokens mittels Service Call an Google
        if (!recaptchaService.verify(recaptchaToken)) {
            logger.warn("UserController.createUser: reCAPTCHA verification failed.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"message\":\"reCAPTCHA verification failed.\"}");
        }

        System.out.println("UserController.createUser: captcha passed.");
        // Ende CAPTCHA PRÜFUNG

        //input validation
        if (bindingResult.hasErrors()) {
            List<String> errors = bindingResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                    .collect(Collectors.toList());
            System.out.println("UserController.createUser " + errors);

            JsonArray arr = new JsonArray();
            errors.forEach(arr::add);
            JsonObject obj = new JsonObject();
            obj.add("message", arr);
            String json = new Gson().toJson(obj);

            System.out.println("UserController.createUser, validation fails: " + json);
            return ResponseEntity.badRequest().body(json);
        }
        System.out.println("UserController.createUser: input validation passed");

        //password validation
        if (!registerUser.getPassword().equals(registerUser.getPasswordConfirmation())) {
            JsonObject obj = new JsonObject();
            obj.addProperty("message", "Passwords do not match.");
            return ResponseEntity.badRequest().body(new Gson().toJson(obj));
        }
        System.out.println("UserController.createUser, password validation passed");

        List<String> commonPasswords = Arrays.asList("123456", "password", "12345678", "qwerty", "abc123");
        if (commonPasswords.contains(registerUser.getPassword().toLowerCase())) {
            return ResponseEntity.badRequest().body("{\"message\":\"Password is too common.\"}");
        }


        //transform registerUser to user
        User user = new User(
                null,
                registerUser.getFirstName(),
                registerUser.getLastName(),
                registerUser.getEmail(),
                passwordService.hashPassword(registerUser.getPassword())
        );

        User savedUser = userService.createUser(user);
        JsonObject obj = new JsonObject();
        if (savedUser != null) {
            System.out.println("UserController.createUser, user saved in db");
            obj.addProperty("answer", "User saved");
        } else {
            System.out.println("UserController.createUser, user not saved in db");
            obj.addProperty("answer", "User not saved");
        }
        String json = new Gson().toJson(obj);
        System.out.println("UserController.createUser " + json);
        return ResponseEntity.accepted().body(json);
    }

    // build get user by id REST API
    // http://localhost:8080/api/users/1
    @CrossOrigin(origins = "${CROSS_ORIGIN}")
    @GetMapping("{id}")
    public ResponseEntity<User> getUserById(@PathVariable("id") Long userId) {
        User user = userService.getUserById(userId);
        if (user == null) return ResponseEntity.notFound().build();
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    // Build Get All Users REST API
    // http://localhost:8080/api/users
    @CrossOrigin(origins = "${CROSS_ORIGIN}")
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        if (users.isEmpty()) return ResponseEntity.notFound().build();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    // Build Update User REST API
    // http://localhost:8080/api/users/1
    @CrossOrigin(origins = "${CROSS_ORIGIN}")
    @PutMapping("{id}")
    public ResponseEntity<User> updateUser(@PathVariable("id") Long userId,
                                           @RequestBody User user) {
        user.setId(userId);
        User updatedUser = userService.updateUser(user);
        if (updatedUser == null) return ResponseEntity.notFound().build();
        return new ResponseEntity<>(updatedUser, HttpStatus.OK);
    }

    // Build Delete User REST API
    @CrossOrigin(origins = "${CROSS_ORIGIN}")
    @DeleteMapping("{id}")
    public ResponseEntity<String> deleteUser(@PathVariable("id") Long userId) {
        if (userService.deleteUser(userId))
            return new ResponseEntity<>("User successfully deleted!", HttpStatus.OK);
        return ResponseEntity.notFound().build();
    }

    // get user id by email
    @CrossOrigin(origins = "${CROSS_ORIGIN}")
    @PostMapping("/byemail")
    public ResponseEntity<String> getUserIdByEmail(@RequestBody EmailAdress email, BindingResult bindingResult) {
        System.out.println("UserController.getUserIdByEmail: " + email);
        //input validation
        if (bindingResult.hasErrors()) {
            List<String> errors = bindingResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                    .collect(Collectors.toList());
            System.out.println("UserController.createUser " + errors);

            JsonArray arr = new JsonArray();
            errors.forEach(arr::add);
            JsonObject obj = new JsonObject();
            obj.add("message", arr);
            String json = new Gson().toJson(obj);

            System.out.println("UserController.createUser, validation fails: " + json);
            return ResponseEntity.badRequest().body(json);
        }

        System.out.println("UserController.getUserIdByEmail: input validation passed");

        User user = userService.findByEmail(email.getEmail());
        if (user == null) {
            System.out.println("UserController.getUserIdByEmail, no user found with email: " + email);
            JsonObject obj = new JsonObject();
            obj.addProperty("message", "No user found with this email");
            String json = new Gson().toJson(obj);

            System.out.println("UserController.getUserIdByEmail, fails: " + json);
            return ResponseEntity.badRequest().body(json);
        }
        System.out.println("UserController.getUserIdByEmail, user find by email");
        JsonObject obj = new JsonObject();
        obj.addProperty("answer", user.getId());
        String json = new Gson().toJson(obj);
        System.out.println("UserController.getUserIdByEmail " + json);
        return ResponseEntity.accepted().body(json);
    }

    // simple login with no websecurity, just name and password
    @CrossOrigin(origins = "${CROSS_ORIGIN}")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> doLoginUser(@RequestBody LoginUser loginUser, BindingResult bindingResult) {
        System.out.println("UserController.doLoginUser: " + loginUser);

        if (bindingResult.hasErrors()) {
            String errorMessage = bindingResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
                    .collect(Collectors.joining("; "));
            return ResponseEntity.badRequest().body(new LoginResponse(errorMessage, null));
        }

        User user = userService.findByEmail(loginUser.getEmail());
        if (user == null) {
            System.out.println("UserController.doLoginUser: user not found");
            return ResponseEntity.badRequest().body(new LoginResponse("No user found with this email", null));
        }

        // ✅ Password verification
        boolean passwordMatches = passwordService.doPasswordMatch(loginUser.getPassword(), user.getPassword());
        if (!passwordMatches) {
            System.out.println("UserController.doLoginUser: invalid password");
            return ResponseEntity.badRequest().body(new LoginResponse("Password incorrect", null));
        }

        System.out.println("UserController.doLoginUser: login successful");
        return ResponseEntity.ok(new LoginResponse("Login successful", user.getId()));
    }


    // 🚀 HINZUGEFÜGT: Innere statische Klasse für den RecaptchaService
    // Diese Klasse wird durch die @Bean-Definition in der Hauptanwendungsklasse injiziert.
    public static class RecaptchaService {

        // Wird automatisch aus application.properties geladen
        @Value("${google.recaptcha.secret}")
        private String recaptchaSecret;

        private static final String RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

        private final RestTemplate restTemplate;

        // RestTemplate wird durch Spring injiziert (da es als Bean definiert ist)
        public RecaptchaService(RestTemplate restTemplate) {
            this.restTemplate = restTemplate;
        }

        public boolean verify(String recaptchaToken) {
            try {
                // Parameter für den POST-Request erstellen
                JsonObject request = new JsonObject();
                request.addProperty("secret", recaptchaSecret);
                request.addProperty("response", recaptchaToken);

                // POST-Request an reCAPTCHA API senden
                RecaptchaResponse response = restTemplate.postForObject(
                        RECAPTCHA_VERIFY_URL,
                        request.toString(),
                        RecaptchaResponse.class
                );

                // Ergebnis auswerten
                return response != null && response.isSuccess();
            } catch (Exception e) {
                // Fehler loggen und Verifizierung ablehnen
                LoggerFactory.getLogger(RecaptchaService.class).error("Error during reCAPTCHA verification: {}", e.getMessage());
                return false;
            }
        }
    }

    // 🚀 HINZUGEFÜGT: Innere statische Klasse für die JSON-Antwort von Google
    public static class RecaptchaResponse {
        private boolean success;

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }
    }
}