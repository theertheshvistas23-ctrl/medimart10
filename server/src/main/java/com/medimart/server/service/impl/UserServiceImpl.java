package com.medimart.server.service.impl;

import com.medimart.server.entity.User;
import com.medimart.server.repository.UserRepository;
import com.medimart.server.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl
        implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<User> getAllUsers() {

        return userRepository.findAll();
    }
}