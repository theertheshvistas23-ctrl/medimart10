package com.medimart.server.service.impl;

import com.medimart.server.entity.Role;
import com.medimart.server.entity.User;
import com.medimart.server.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User register(User user) {

        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        if (user.getRole() == Role.CASHIER) {

            user.setApproved(false);

        } else {

            user.setApproved(true);
        }

        return userRepository.save(user);
    }

    public User login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        boolean passwordMatch =
                passwordEncoder.matches(
                        password,
                        user.getPassword()
                );

        if (!passwordMatch) {

            throw new RuntimeException(
                    "Invalid password"
            );
        }

        if (user.getRole() == Role.CASHIER
                && !user.getApproved()) {

            throw new RuntimeException(
                    "Waiting for admin approval"
            );
        }

        return user;
    }
}