-- CreateEnum
CREATE TYPE "OnboardingStage" AS ENUM ('PHONE_VERIFICATION', 'APP_PERMISSIONS', 'SELECT_LOCATION', 'SELECT_VEHICLE', 'PERSONAL_INFO', 'SELFIE', 'AADHAAR', 'PAN_UPLOAD', 'DL_UPLOAD', 'KYC_SUBMITTED', 'KYC_APPROVAL_PENDING', 'KYC_APPROVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('ev', 'bike', 'scooty');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "BankVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "IfscVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CURRENT', 'SAVINGS');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('READY', 'BUSY');

-- CreateEnum
CREATE TYPE "InactiveReason" AS ENUM ('MANUAL_OFF', 'KYC_PENDING', 'ACCOUNT_SUSPENDED', 'OUT_OF_SERVICE_AREA', 'COD_LIMIT_EXCEEDED');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('GOOD', 'BAD');

-- CreateEnum
CREATE TYPE "AssetIssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AssetIssueType" AS ENUM ('DAMAGED', 'LOST', 'WRONG_SIZE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ISSUED', 'RETURNED', 'LOST');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('T_SHIRT', 'BAG', 'HELMET', 'JACKET', 'ID_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('NOT_DISPATCHED', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('FULL', 'EMI');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAYMENT_PENDING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "SlotBookingStatus" AS ENUM ('BOOKED', 'CANCELLED_BY_RIDER', 'CANCELLED_BY_SYSTEM', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SlotProgress" AS ENUM ('UPCOMING', 'RUNNING', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "SlotBookedFrom" AS ENUM ('APP', 'ADMIN');

-- CreateEnum
CREATE TYPE "WeeklySlotStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RiderSlotStatus" AS ENUM ('BOOKED', 'CANCELLED', 'NO_SHOW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('CUSTOMER', 'RIDER', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CodPaymentType" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "CodStatus" AS ENUM ('PENDING', 'PARTIAL_DEPOSITED', 'DEPOSITED');

-- CreateEnum
CREATE TYPE "MultiplierType" AS ENUM ('FIXED', 'PER_ORDER');

-- CreateEnum
CREATE TYPE "OrderPaymentMode" AS ENUM ('ONLINE', 'COD');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SurgeType" AS ENUM ('PEAK', 'RAIN', 'ZONE', 'NIGHT', 'HIGH_DEMAND');

-- CreateTable
CREATE TABLE "Rider" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT '+91',
    "phoneNumber" TEXT NOT NULL,
    "phoneIsVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "lastOtpVerifiedAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "deviceToken" TEXT,
    "fcmToken" TEXT,
    "onboardingStage" "OnboardingStage" NOT NULL DEFAULT 'PHONE_VERIFICATION',
    "isFullyRegistered" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "orderState" "OrderState" NOT NULL DEFAULT 'READY',
    "currentOrderId" TEXT,
    "partnerId" TEXT,
    "isPartnerActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderOnboarding" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "appPermissionDone" BOOLEAN NOT NULL DEFAULT false,
    "citySelected" BOOLEAN NOT NULL DEFAULT false,
    "vehicleSelected" BOOLEAN NOT NULL DEFAULT false,
    "personalInfoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "selfieUploaded" BOOLEAN NOT NULL DEFAULT false,
    "aadharVerified" BOOLEAN NOT NULL DEFAULT false,
    "panUploaded" BOOLEAN NOT NULL DEFAULT false,
    "dlUploaded" BOOLEAN NOT NULL DEFAULT false,
    "kycCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RiderOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderPermissions" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "camera" BOOLEAN NOT NULL DEFAULT false,
    "foregroundLocation" BOOLEAN NOT NULL DEFAULT false,
    "backgroundLocation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RiderPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderStatus" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "lastLogoutAt" TIMESTAMP(3),
    "totalOnlineMinutesToday" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RiderStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderGps" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "RiderGps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderProfile" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "fullName" TEXT,
    "dob" TIMESTAMP(3),
    "gender" "Gender",
    "primaryPhone" TEXT,
    "secondaryPhone" TEXT,
    "email" TEXT,

    CONSTRAINT "RiderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderLocation" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "streetAddress" TEXT,
    "area" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,

    CONSTRAINT "RiderLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderVehicle" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,

    CONSTRAINT "RiderVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderSelfie" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderSelfie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderKyc" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "aadharStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "aadharRejectedReason" TEXT,
    "panNumber" TEXT,
    "panImage" TEXT,
    "panStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "panRejectedReason" TEXT,
    "panOcrAttempts" INTEGER NOT NULL DEFAULT 0,
    "panAllowManual" BOOLEAN NOT NULL DEFAULT false,
    "dlNumber" TEXT,
    "dlFrontImage" TEXT,
    "dlBackImage" TEXT,
    "dlStatus" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "dlRejectedReason" TEXT,
    "dlOcrAttempts" INTEGER NOT NULL DEFAULT 0,
    "dlAllowManual" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RiderKyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderBankDetails" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "bankName" TEXT,
    "accountHolderName" TEXT,
    "accountType" "AccountType",
    "branch" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "ifscVerificationStatus" "IfscVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "bankVerificationStatus" "BankVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "RiderBankDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderWallet" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWithdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RiderWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderCashInHand" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "limit" DOUBLE PRECISION NOT NULL DEFAULT 250000,
    "lastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "RiderCashInHand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderKitAddress" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "name" TEXT,
    "mobileNumber" TEXT,
    "completeAddress" TEXT,
    "landmark" TEXT,
    "pincode" TEXT,
    "onboardingKitStatus" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RiderKitAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderDeliveryStatus" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "inactiveReason" "InactiveReason" NOT NULL DEFAULT 'MANUAL_OFF',
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "RiderDeliveryStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMaster" (
    "id" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "freeLimit" INTEGER NOT NULL,
    "issuedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assetName" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetRequest" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EMIPlan" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "months" INTEGER NOT NULL,
    "monthlyAmount" DOUBLE PRECISION NOT NULL,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EMIPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "assetRequestId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "assetRequestId" TEXT NOT NULL,
    "courierName" TEXT,
    "trackingId" TEXT,
    "dispatchDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'NOT_DISPATCHED',

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rider_asset_issues" (
    "id" TEXT NOT NULL,
    "riderAssetsId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "assetName" TEXT,
    "issueType" "AssetIssueType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "imageUrl" TEXT,
    "status" "AssetIssueStatus" NOT NULL DEFAULT 'OPEN',
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "rider_asset_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rider_asset_items" (
    "id" TEXT NOT NULL,
    "riderAssetsId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "assetName" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedDate" TIMESTAMP(3),
    "status" "AssetStatus" NOT NULL DEFAULT 'ISSUED',
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',

    CONSTRAINT "rider_asset_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rider_assets" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "issuedByAdminId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rider_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySlot" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slot" (
    "slotId" TEXT NOT NULL,
    "weeklySlotId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "slotStartAt" TIMESTAMP(3) NOT NULL,
    "slotEndAt" TIMESTAMP(3) NOT NULL,
    "breakInMinutes" INTEGER NOT NULL DEFAULT 10,
    "maxRiders" INTEGER NOT NULL,
    "bookedRiders" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "autoLocked" BOOLEAN NOT NULL DEFAULT false,
    "isPeakSlot" BOOLEAN NOT NULL DEFAULT false,
    "incentiveText" TEXT NOT NULL DEFAULT '',
    "incentiveAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "WeeklySlotStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("slotId")
);

-- CreateTable
CREATE TABLE "SlotRider" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "status" "RiderSlotStatus" NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "noShowAt" TIMESTAMP(3),

    CONSTRAINT "SlotRider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotBooking" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "daySlotId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "slotKey" TEXT,
    "date" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "city" TEXT,
    "zone" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "slotStartAt" TIMESTAMP(3) NOT NULL,
    "slotEndAt" TIMESTAMP(3) NOT NULL,
    "totalMinutes" INTEGER,
    "isPeakSlot" BOOLEAN NOT NULL DEFAULT false,
    "incentiveText" TEXT NOT NULL DEFAULT '',
    "status" "SlotBookingStatus" NOT NULL DEFAULT 'BOOKED',
    "progress" "SlotProgress" NOT NULL DEFAULT 'UPCOMING',
    "bookedFrom" "SlotBookedFrom" NOT NULL DEFAULT 'APP',
    "cancellationReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlotBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "riderId" TEXT,
    "vendorShopName" TEXT NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPricing" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemTotal" DOUBLE PRECISION,
    "deliveryFee" DOUBLE PRECISION,
    "tax" DOUBLE PRECISION,
    "platformCommission" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,

    CONSTRAINT "OrderPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "mode" "OrderPaymentMode" NOT NULL,
    "codPaymentType" "CodPaymentType" NOT NULL DEFAULT 'CASH',
    "status" "OrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCod" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CodStatus" NOT NULL DEFAULT 'PENDING',
    "collectedAt" TIMESTAMP(3),
    "depositedAt" TIMESTAMP(3),

    CONSTRAINT "OrderCod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPickupAddress" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT,
    "addressLine" TEXT,
    "contactNumber" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "OrderPickupAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDeliveryAddress" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT,
    "addressLine" TEXT,
    "contactNumber" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "OrderDeliveryAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderRiderEarning" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "riderId" TEXT,
    "basePay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "distancePay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "surgePay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tips" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarning" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credited" BOOLEAN NOT NULL DEFAULT false,
    "creditedAt" TIMESTAMP(3),

    CONSTRAINT "OrderRiderEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSurge" (
    "id" TEXT NOT NULL,
    "riderEarningId" TEXT NOT NULL,
    "type" "SurgeType" NOT NULL,
    "multiplierType" "MultiplierType" NOT NULL,
    "value" DOUBLE PRECISION,

    CONSTRAINT "OrderSurge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSlotInfo" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "slotBookingId" TEXT,
    "slotId" TEXT,
    "isSlotBooked" BOOLEAN NOT NULL DEFAULT false,
    "isPeakSlot" BOOLEAN,
    "slotStartAt" TIMESTAMP(3),
    "slotEndAt" TIMESTAMP(3),

    CONSTRAINT "OrderSlotInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTracking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "distanceInKm" DOUBLE PRECISION,
    "durationInMin" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAllocation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "OrderAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCandidateRider" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'PENDING',
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "OrderCandidateRider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCancelIssue" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "cancelledBy" "CancelledBy",
    "reasonCode" TEXT,
    "reasonText" TEXT,

    CONSTRAINT "OrderCancelIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSettlement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "riderEarningAdded" BOOLEAN NOT NULL DEFAULT false,
    "vendorSettled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rider_phoneNumber_key" ON "Rider"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_partnerId_key" ON "Rider"("partnerId");

-- CreateIndex
CREATE INDEX "Rider_phoneNumber_idx" ON "Rider"("phoneNumber");

-- CreateIndex
CREATE INDEX "Rider_isOnline_idx" ON "Rider"("isOnline");

-- CreateIndex
CREATE INDEX "Rider_orderState_idx" ON "Rider"("orderState");

-- CreateIndex
CREATE UNIQUE INDEX "RiderOnboarding_riderId_key" ON "RiderOnboarding"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderPermissions_riderId_key" ON "RiderPermissions"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderStatus_riderId_key" ON "RiderStatus"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderGps_riderId_key" ON "RiderGps"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderProfile_riderId_key" ON "RiderProfile"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderLocation_riderId_key" ON "RiderLocation"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderVehicle_riderId_key" ON "RiderVehicle"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderSelfie_riderId_key" ON "RiderSelfie"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderKyc_riderId_key" ON "RiderKyc"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderBankDetails_riderId_key" ON "RiderBankDetails"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderWallet_riderId_key" ON "RiderWallet"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderCashInHand_riderId_key" ON "RiderCashInHand"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderKitAddress_riderId_key" ON "RiderKitAddress"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderDeliveryStatus_riderId_key" ON "RiderDeliveryStatus"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetMaster_assetType_key" ON "AssetMaster"("assetType");

-- CreateIndex
CREATE UNIQUE INDEX "EMIPlan_paymentId_key" ON "EMIPlan"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_assetRequestId_key" ON "Payment"("assetRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_assetRequestId_key" ON "Shipment"("assetRequestId");

-- CreateIndex
CREATE INDEX "rider_asset_issues_status_idx" ON "rider_asset_issues"("status");

-- CreateIndex
CREATE INDEX "rider_asset_items_assetType_idx" ON "rider_asset_items"("assetType");

-- CreateIndex
CREATE INDEX "rider_assets_riderId_idx" ON "rider_assets"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklySlot_weekNumber_year_city_zone_key" ON "WeeklySlot"("weekNumber", "year", "city", "zone");

-- CreateIndex
CREATE INDEX "Slot_slotKey_idx" ON "Slot"("slotKey");

-- CreateIndex
CREATE INDEX "Slot_slotStartAt_idx" ON "Slot"("slotStartAt");

-- CreateIndex
CREATE UNIQUE INDEX "SlotRider_slotId_riderId_key" ON "SlotRider"("slotId", "riderId");

-- CreateIndex
CREATE INDEX "SlotBooking_riderId_idx" ON "SlotBooking"("riderId");

-- CreateIndex
CREATE INDEX "SlotBooking_slotStartAt_idx" ON "SlotBooking"("slotStartAt");

-- CreateIndex
CREATE INDEX "SlotBooking_status_idx" ON "SlotBooking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SlotBooking_riderId_date_slotId_key" ON "SlotBooking"("riderId", "date", "slotId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Order_riderId_idx" ON "Order"("riderId");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPricing_orderId_key" ON "OrderPricing"("orderId");

-- CreateIndex
CREATE INDEX "OrderPricing_orderId_idx" ON "OrderPricing"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPayment_orderId_key" ON "OrderPayment"("orderId");

-- CreateIndex
CREATE INDEX "OrderPayment_orderId_idx" ON "OrderPayment"("orderId");

-- CreateIndex
CREATE INDEX "OrderPayment_mode_idx" ON "OrderPayment"("mode");

-- CreateIndex
CREATE INDEX "OrderPayment_status_idx" ON "OrderPayment"("status");

-- CreateIndex
CREATE INDEX "OrderPayment_createdAt_idx" ON "OrderPayment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCod_orderId_key" ON "OrderCod"("orderId");

-- CreateIndex
CREATE INDEX "OrderCod_orderId_idx" ON "OrderCod"("orderId");

-- CreateIndex
CREATE INDEX "OrderCod_status_idx" ON "OrderCod"("status");

-- CreateIndex
CREATE INDEX "OrderCod_collectedAt_idx" ON "OrderCod"("collectedAt");

-- CreateIndex
CREATE INDEX "OrderCod_depositedAt_idx" ON "OrderCod"("depositedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPickupAddress_orderId_key" ON "OrderPickupAddress"("orderId");

-- CreateIndex
CREATE INDEX "OrderPickupAddress_orderId_idx" ON "OrderPickupAddress"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderDeliveryAddress_orderId_key" ON "OrderDeliveryAddress"("orderId");

-- CreateIndex
CREATE INDEX "OrderDeliveryAddress_orderId_idx" ON "OrderDeliveryAddress"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderRiderEarning_orderId_key" ON "OrderRiderEarning"("orderId");

-- CreateIndex
CREATE INDEX "OrderRiderEarning_orderId_idx" ON "OrderRiderEarning"("orderId");

-- CreateIndex
CREATE INDEX "OrderRiderEarning_riderId_idx" ON "OrderRiderEarning"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderSlotInfo_orderId_key" ON "OrderSlotInfo"("orderId");

-- CreateIndex
CREATE INDEX "OrderSlotInfo_orderId_idx" ON "OrderSlotInfo"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderTracking_orderId_key" ON "OrderTracking"("orderId");

-- CreateIndex
CREATE INDEX "OrderTracking_orderId_idx" ON "OrderTracking"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderAllocation_orderId_key" ON "OrderAllocation"("orderId");

-- CreateIndex
CREATE INDEX "OrderAllocation_orderId_idx" ON "OrderAllocation"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCancelIssue_orderId_key" ON "OrderCancelIssue"("orderId");

-- CreateIndex
CREATE INDEX "OrderCancelIssue_orderId_idx" ON "OrderCancelIssue"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderSettlement_orderId_key" ON "OrderSettlement"("orderId");

-- CreateIndex
CREATE INDEX "OrderSettlement_orderId_idx" ON "OrderSettlement"("orderId");

-- AddForeignKey
ALTER TABLE "RiderOnboarding" ADD CONSTRAINT "RiderOnboarding_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderPermissions" ADD CONSTRAINT "RiderPermissions_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderStatus" ADD CONSTRAINT "RiderStatus_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderGps" ADD CONSTRAINT "RiderGps_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderProfile" ADD CONSTRAINT "RiderProfile_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderLocation" ADD CONSTRAINT "RiderLocation_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderVehicle" ADD CONSTRAINT "RiderVehicle_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderSelfie" ADD CONSTRAINT "RiderSelfie_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderKyc" ADD CONSTRAINT "RiderKyc_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderBankDetails" ADD CONSTRAINT "RiderBankDetails_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderWallet" ADD CONSTRAINT "RiderWallet_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderCashInHand" ADD CONSTRAINT "RiderCashInHand_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderKitAddress" ADD CONSTRAINT "RiderKitAddress_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderDeliveryStatus" ADD CONSTRAINT "RiderDeliveryStatus_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EMIPlan" ADD CONSTRAINT "EMIPlan_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_assetRequestId_fkey" FOREIGN KEY ("assetRequestId") REFERENCES "AssetRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_assetRequestId_fkey" FOREIGN KEY ("assetRequestId") REFERENCES "AssetRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_asset_issues" ADD CONSTRAINT "rider_asset_issues_riderAssetsId_fkey" FOREIGN KEY ("riderAssetsId") REFERENCES "rider_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_asset_items" ADD CONSTRAINT "rider_asset_items_riderAssetsId_fkey" FOREIGN KEY ("riderAssetsId") REFERENCES "rider_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rider_assets" ADD CONSTRAINT "rider_assets_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_weeklySlotId_fkey" FOREIGN KEY ("weeklySlotId") REFERENCES "WeeklySlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotRider" ADD CONSTRAINT "SlotRider_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotRider" ADD CONSTRAINT "SlotRider_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("slotId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotBooking" ADD CONSTRAINT "SlotBooking_daySlotId_fkey" FOREIGN KEY ("daySlotId") REFERENCES "WeeklySlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotBooking" ADD CONSTRAINT "SlotBooking_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotBooking" ADD CONSTRAINT "SlotBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("slotId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPricing" ADD CONSTRAINT "OrderPricing_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCod" ADD CONSTRAINT "OrderCod_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPickupAddress" ADD CONSTRAINT "OrderPickupAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDeliveryAddress" ADD CONSTRAINT "OrderDeliveryAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRiderEarning" ADD CONSTRAINT "OrderRiderEarning_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRiderEarning" ADD CONSTRAINT "OrderRiderEarning_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSurge" ADD CONSTRAINT "OrderSurge_riderEarningId_fkey" FOREIGN KEY ("riderEarningId") REFERENCES "OrderRiderEarning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSlotInfo" ADD CONSTRAINT "OrderSlotInfo_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTracking" ADD CONSTRAINT "OrderTracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAllocation" ADD CONSTRAINT "OrderAllocation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCandidateRider" ADD CONSTRAINT "OrderCandidateRider_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "OrderAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCancelIssue" ADD CONSTRAINT "OrderCancelIssue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSettlement" ADD CONSTRAINT "OrderSettlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
