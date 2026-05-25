package com.medimart.server.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.medimart.server.entity.Order;
import com.medimart.server.service.OrderService;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin("*")
public class CustomerController {

    private final OrderService orderService;

    public CustomerController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/orders/{customerId}")
    public List<Order> getOrders(@PathVariable Long customerId) {
        return orderService.getCustomerOrders(customerId);
    }
}
