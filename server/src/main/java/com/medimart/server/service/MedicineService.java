package com.medimart.server.service;


import java.util.List;

import com.medimart.server.entity.Medicine;

public interface MedicineService {

    Medicine addMedicine(Medicine medicine);

    List<Medicine> getAllMedicines();

    Medicine updateMedicine(Long id, Medicine medicine);

    void deleteMedicine(Long id);
}