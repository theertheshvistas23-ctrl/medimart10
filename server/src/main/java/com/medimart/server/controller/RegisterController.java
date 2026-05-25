package com.medimart.server.controller;

import com.medimart.server.entity.Role;
import com.medimart.server.entity.User;
import com.medimart.server.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/register")
@CrossOrigin("*")
public class RegisterController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    public ResponseEntity<?> registerUser(@RequestBody User user) {

        try {

            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Username is required");
            }

            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Email is required");
            }

            if (user.getPhoneNumber() == null || user.getPhoneNumber().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Phone number is required");
            }

            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Password is required");
            }

            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body("Email already exists");
            }

            user.setPassword(
                    passwordEncoder.encode(user.getPassword())
            );

            if (user.getRole() != null &&
                    user.getRole().equals(Role.CASHIER)) {

                user.setApproved(false);

            } else {

                user.setApproved(true);
            }

            userRepository.save(user);

            return ResponseEntity.ok("Registration successful");

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.badRequest()
                    .body("Registration failed");
        }
    }
}