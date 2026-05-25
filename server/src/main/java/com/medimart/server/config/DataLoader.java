package com.medimart.server.config;

import com.medimart.server.entity.Role;
import com.medimart.server.entity.User;
import com.medimart.server.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner loadAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {

        return args -> {

            if (userRepository.findByEmail("admin@gmail.com")
                    .isEmpty()) {

                User admin = new User();

                admin.setUsername("Admin");

                admin.setEmail("admin@gmail.com");

                admin.setPassword(
                        passwordEncoder.encode("admin123")
                );

                admin.setRole(Role.ADMIN);

                admin.setPhoneNumber("1234567890");

                admin.setApproved(true);

                userRepository.save(admin);

                System.out.println(
                        "Default admin created"
                );
            }
        };
    }
}