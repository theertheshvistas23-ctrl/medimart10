package com.medimart.server.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.medimart.server.entity.Medicine;
import com.medimart.server.entity.Order;
import com.medimart.server.service.MedicineService;
import com.medimart.server.service.OrderService;

@RestController
@RequestMapping("/api/cashier")
@CrossOrigin("*")
public class CashierController {

    private final MedicineService medicineService;
    private final OrderService orderService;

    public CashierController(
            MedicineService medicineService,
            OrderService orderService) {

        this.medicineService = medicineService;
        this.orderService = orderService;
    }

    @GetMapping("/medicine")
    public List<Medicine> getMedicines() {
        return medicineService.getAllMedicines();
    }

    @PostMapping("/order")
    public Order createOrder(@RequestBody Order order) {
        return orderService.createOrder(order);
    }
}
