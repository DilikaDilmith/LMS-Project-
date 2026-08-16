package com.lms.lms_backend.util;

public class TenantContext {
    private static final ThreadLocal<Long> currentInstituteId = new ThreadLocal<>();

    public static void setInstituteId(Long instituteId) {
        currentInstituteId.set(instituteId);
    }

    public static Long getInstituteId() {
        return currentInstituteId.get();
    }

    public static void clear() {
        currentInstituteId.remove();
    }
}