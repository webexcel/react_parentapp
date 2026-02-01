export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SEND_OTP: '/auth/mobileInstallsNew',
    VERIFY_OTP: '/auth/mobileInstallerVerify',
    GET_STUDENTS: '/auth/getMobStudentDetail',
    GET_STUDENT_PHOTO: '/auth/getMobStudentPhoto',
    UPDATE_FCM_TOKEN: '/auth/updateParentFirebaseId',
  },

  // Dashboard
  DASHBOARD: {
    LATEST_MESSAGE: '/dashboard/getLatestMessage',
    FLASH_MESSAGE: '/dashboard/getFlashMessage',
    FEES_FLASH: '/dashboard/feesFlash',
    CHECK_FEES_BALANCE: '/dashboard/checkFeesBalance',
    BATCH_COUNT: '/dashboard/batchCount',
    GET_ID_CARD: '/dashboard/getIdCard',
  },

  // Circulars
  CIRCULAR: {
    GET_ALL: '/circular/getAllMessagesByMobileNumber',
    GET_BASE64: '/circular/getBase64',
  },

  // Homework
  HOMEWORK: {
    GET_BY_CLASS: '/homework/getSaveHomeworkByClass',
    MARK_COMPLETE: '/homework/markHomeworkComplete',
  },

  // Attendance
  ATTENDANCE: {
    GET: '/attendance/getAttendance',
  },

  // Exam Schedule
  EXAM_SCHEDULE: {
    GET: '/examSchedule/getParentExamSchedule',
    GET_ALL_EXAMS: '/examSchedule/getAllExam',
  },

  // Gallery
  GALLERY: {
    GET_CATEGORIES: '/gallery/getParentCategory',
    GET_ALL_IMAGES: '/gallery/getCategoryAll',
  },

  // Marks/Report Card
  MARKS: {
    GET_BY_ADNO: '/reportcard/getMarksOnAdno',
    SELECT_EXAM_NAME: '/reportcard/selectExamName',
    GET_TERM_REPORTCARD: '/reportCard/getTermReportcardAdno',
  },

  // Payments/Fees
  PAYMENTS: {
    GET_STUDENT_PAY_DETAILS: '/payments/getStudentPayDetails',
    GET_PAY_ENABLE: '/payments/getPayEnable',
    GET_FEE_INSTALLMENT: '/payments/getFeeInstallment',
    GET_STUDENT_PAY_HISTORY: '/payments/getStudentPayHistory',
    GET_PRINT_BILL: '/payments/getPrintBill',
    PAY_ONLINE: '/payments/payOnline',
    UPDATE_ORDER_ID: '/payments/updateOrderId',
    GET_YEAR_ID: '/payments/getYearId',
    CHECK_FEES_DEFAULTER: '/payments/checkFeesDefaulter',
    GET_MOB_FEES_STUDENT_DETAIL: '/payments/getMobFeesStudentDetail',
  },
  // Chatbot - Dialogflow CX
  CHATBOT: {
    DIALOGFLOW_MESSAGE: '/chatbot/dialogflow/message',
    DIALOGFLOW_RESET: '/chatbot/dialogflow/reset',
  },

  // Parent Message - Send messages to school
  PARENT_MESSAGE: {
    GET_MESSAGES: '/parentMessage/getParentUploadDetails',
    SAVE_MESSAGE: '/parentMessage/saveMessage',
    DELETE_MESSAGE: '/parentMessage/deleteMessage',
  },

  // Leave Letter - Request leaves for students
  LEAVE_LETTER: {
    GET: '/leaveletter/getLeaveRequest',
    INSERT: '/leaveletter/insertLeaveRequest',
    UPDATE: '/leaveletter/updateLeaveRequest',
    DELETE: '/leaveLetter/deleteLeaveRequest',
  },
} as const;
