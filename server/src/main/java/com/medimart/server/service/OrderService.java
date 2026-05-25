package com.medimart.server.service;

import java.util.List;

import com.medimart.server.entity.Order;

public interface OrderService {

    Order createOrder(Order order);

    List<Order> getCustomerOrders(Long customerId);
}