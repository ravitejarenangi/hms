'use client';

import React from 'react';
import { Icon } from '@iconify/react';

const AdminMetrics = () => {
  return (
    <div className="row row-cols-xxxl-5 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-4">
      {/* Total Patients */}
      <div className="col">
        <div className="card shadow-none border bg-gradient-start-1 h-100">
          <div className="card-body p-20">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="fw-medium text-primary-light mb-1">Total Patients</p>
                <h6 className="mb-0">5,482</h6>
              </div>
              <div className="w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center">
                <Icon
                  icon="healthicons:outpatient"
                  className="text-white text-2xl mb-0"
                />
              </div>
            </div>
            <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
              <span className="d-inline-flex align-items-center gap-1 text-success-main">
                <Icon icon="bxs:up-arrow" className="text-xs" /> +124
              </span>
              New patients this month
            </p>
          </div>
        </div>
      </div>

      {/* Total Admissions */}
      <div className="col">
        <div className="card shadow-none border bg-gradient-start-2 h-100">
          <div className="card-body p-20">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="fw-medium text-primary-light mb-1">Total Admissions</p>
                <h6 className="mb-0">1,248</h6>
              </div>
              <div className="w-50-px h-50-px bg-purple rounded-circle d-flex justify-content-center align-items-center">
                <Icon
                  icon="healthicons:inpatient"
                  className="text-white text-2xl mb-0"
                />
              </div>
            </div>
            <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
              <span className="d-inline-flex align-items-center gap-1 text-success-main">
                <Icon icon="bxs:up-arrow" className="text-xs" /> +56
              </span>
              Admissions this month
            </p>
          </div>
        </div>
      </div>

      {/* Total Discharges */}
      <div className="col">
        <div className="card shadow-none border bg-gradient-start-3 h-100">
          <div className="card-body p-20">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="fw-medium text-primary-light mb-1">Total Discharges</p>
                <h6 className="mb-0">1,142</h6>
              </div>
              <div className="w-50-px h-50-px bg-orange rounded-circle d-flex justify-content-center align-items-center">
                <Icon
                  icon="healthicons:discharge-completed"
                  className="text-white text-2xl mb-0"
                />
              </div>
            </div>
            <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
              <span className="d-inline-flex align-items-center gap-1 text-success-main">
                <Icon icon="bxs:up-arrow" className="text-xs" /> +48
              </span>
              Discharges this month
            </p>
          </div>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="col">
        <div className="card shadow-none border bg-gradient-start-4 h-100">
          <div className="card-body p-20">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="fw-medium text-primary-light mb-1">Total Revenue</p>
                <h6 className="mb-0">$1.25M</h6>
              </div>
              <div className="w-50-px h-50-px bg-green rounded-circle d-flex justify-content-center align-items-center">
                <Icon
                  icon="mdi:currency-usd"
                  className="text-white text-2xl mb-0"
                />
              </div>
            </div>
            <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
              <span className="d-inline-flex align-items-center gap-1 text-success-main">
                <Icon icon="bxs:up-arrow" className="text-xs" /> +12%
              </span>
              Compared to last month
            </p>
          </div>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="col">
        <div className="card shadow-none border bg-gradient-start-5 h-100">
          <div className="card-body p-20">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="fw-medium text-primary-light mb-1">Total Expenses</p>
                <h6 className="mb-0">$980K</h6>
              </div>
              <div className="w-50-px h-50-px bg-red rounded-circle d-flex justify-content-center align-items-center">
                <Icon
                  icon="mdi:currency-usd-off"
                  className="text-white text-2xl mb-0"
                />
              </div>
            </div>
            <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
              <span className="d-inline-flex align-items-center gap-1 text-danger-main">
                <Icon icon="bxs:up-arrow" className="text-xs" /> +8%
              </span>
              Compared to last month
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;
