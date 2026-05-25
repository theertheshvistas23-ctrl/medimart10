package com.medimart.server.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.medimart.server.entity.Order;
import com.medimart.server.repository.OrderRepository;
import com.medimart.server.service.OrderService;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository) {

        this.orderRepository = orderRepository;
    }

    @Override
    public Order createOrder(Order order) {

        return orderRepository.save(order);
    }

    @Override
    public List<Order> getCustomerOrders(Long customerId) {

        return orderRepository.findAll();
    }
}