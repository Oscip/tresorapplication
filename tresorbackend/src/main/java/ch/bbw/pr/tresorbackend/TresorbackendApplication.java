package ch.bbw.pr.tresorbackend;

// ⬇️ NEUE IMPORTS FÜR RECAPTCHA / BEANS ⬇️
import ch.bbw.pr.tresorbackend.controller.UserController.RecaptchaService;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
// ⬆️ NEUE IMPORTS FÜR RECAPTCHA / BEANS ⬆️

import ch.bbw.pr.tresorbackend.model.ConfigProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
public class TresorbackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(TresorbackendApplication.class, args);
    }

    // 1. RestTemplate Bean: Wird benötigt, um den HTTP-Call an die Google reCAPTCHA API zu senden.
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder.build();
    }

    // 2. RecaptchaService Bean: Stellt den inneren Service als injizierbare Bean bereit.
    // Sie muss die innere Klasse (RecaptchaService) aus dem UserController importieren.
    @Bean
    public RecaptchaService recaptchaService(RestTemplate restTemplate) {
        // Erstellt eine Instanz des inneren Services und übergibt den RestTemplate,
        // der in der Methode darüber definiert wurde.
        return new RecaptchaService(restTemplate);
    }
}