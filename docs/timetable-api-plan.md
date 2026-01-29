# Timetable Module - API Plan

## Overview
The Timetable module displays weekly class schedules for students. Parents can view their child's daily periods including subject, teacher, timing, and room information.

---

## API Endpoints Required

### 1. Get Timetable (Primary Endpoint)

**Endpoint:** `POST /timetable/getTimetable`

**Purpose:** Fetch the weekly timetable for a specific student

**Request Payload:**
```json
{
  "ADNO": "12345",
  "CLASS_ID": "10"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ADNO | string | Yes | Student admission number |
| CLASS_ID | string | Yes | Student's class ID |

**Response:**
```json
{
  "status": true,
  "message": "Timetable fetched successfully",
  "data": {
    "class_name": "10-A",
    "academic_year": "2024-2025",
    "effective_from": "2024-06-01",
    "schedule": {
      "Monday": [
        {
          "id": 1,
          "period_number": 1,
          "subject_id": 101,
          "subject_name": "Mathematics",
          "teacher_id": 201,
          "teacher_name": "Mrs. Sharma",
          "start_time": "08:30",
          "end_time": "09:15",
          "room": "Room 101"
        },
        {
          "id": 2,
          "period_number": 2,
          "subject_id": 102,
          "subject_name": "English",
          "teacher_id": 202,
          "teacher_name": "Mr. Kumar",
          "start_time": "09:15",
          "end_time": "10:00",
          "room": "Room 101"
        }
      ],
      "Tuesday": [...],
      "Wednesday": [...],
      "Thursday": [...],
      "Friday": [...],
      "Saturday": [...]
    },
    "breaks": [
      {
        "type": "short",
        "name": "Short Break",
        "after_period": 2,
        "start_time": "10:00",
        "end_time": "10:15"
      },
      {
        "type": "lunch",
        "name": "Lunch Break",
        "after_period": 4,
        "start_time": "11:45",
        "end_time": "12:30"
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "status": false,
  "message": "Timetable not found for this class",
  "data": null
}
```

---

### 2. Get Period Details (Optional - for detailed view)

**Endpoint:** `POST /timetable/getPeriodDetails`

**Purpose:** Get detailed information about a specific period (syllabus covered, upcoming topics, etc.)

**Request Payload:**
```json
{
  "ADNO": "12345",
  "PERIOD_ID": "1",
  "DAY": "Monday"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ADNO | string | Yes | Student admission number |
| PERIOD_ID | string | Yes | Period ID from timetable |
| DAY | string | Yes | Day of the week |

**Response:**
```json
{
  "status": true,
  "message": "Period details fetched successfully",
  "data": {
    "id": 1,
    "subject_name": "Mathematics",
    "teacher_name": "Mrs. Sharma",
    "teacher_phone": "+91-9876543210",
    "room": "Room 101",
    "current_chapter": "Quadratic Equations",
    "syllabus_completed": 45,
    "upcoming_topics": [
      "Nature of Roots",
      "Sum and Product of Roots"
    ],
    "notes": "Bring graph paper for next class"
  }
}
```

---

### 3. Get Today's Schedule (Optional - Dashboard widget)

**Endpoint:** `POST /timetable/getTodaySchedule`

**Purpose:** Quick access to today's classes (for dashboard widget)

**Request Payload:**
```json
{
  "ADNO": "12345",
  "CLASS_ID": "10"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Today's schedule fetched successfully",
  "data": {
    "day": "Monday",
    "date": "2024-01-15",
    "is_holiday": false,
    "holiday_name": null,
    "periods": [
      {
        "id": 1,
        "period_number": 1,
        "subject_name": "Mathematics",
        "teacher_name": "Mrs. Sharma",
        "start_time": "08:30",
        "end_time": "09:15",
        "room": "Room 101",
        "is_current": true
      },
      {
        "id": 2,
        "period_number": 2,
        "subject_name": "English",
        "teacher_name": "Mr. Kumar",
        "start_time": "09:15",
        "end_time": "10:00",
        "room": "Room 101",
        "is_current": false
      }
    ],
    "current_period": {
      "period_number": 1,
      "subject_name": "Mathematics",
      "ends_in_minutes": 23
    },
    "next_period": {
      "period_number": 2,
      "subject_name": "English",
      "starts_in_minutes": 23
    }
  }
}
```

---

## Data Types

### Period Object
```typescript
interface Period {
  id: number;
  period_number: number;      // 1, 2, 3, etc.
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  start_time: string;         // "HH:MM" format (24-hour)
  end_time: string;           // "HH:MM" format (24-hour)
  room: string | null;
}
```

### Break Object
```typescript
interface Break {
  type: 'short' | 'lunch' | 'assembly';
  name: string;
  after_period: number;       // Break comes after this period
  start_time: string;
  end_time: string;
}
```

### Schedule Object
```typescript
interface TimetableSchedule {
  Monday: Period[];
  Tuesday: Period[];
  Wednesday: Period[];
  Thursday: Period[];
  Friday: Period[];
  Saturday: Period[];
}
```

### Full Response Type
```typescript
interface TimetableResponse {
  status: boolean;
  message: string;
  data: {
    class_name: string;
    academic_year: string;
    effective_from: string;
    schedule: TimetableSchedule;
    breaks: Break[];
  } | null;
}
```

---

## API Summary Table

| # | Endpoint | Method | Purpose | Required |
|---|----------|--------|---------|----------|
| 1 | `/timetable/getTimetable` | POST | Get full weekly timetable | **Yes** |
| 2 | `/timetable/getPeriodDetails` | POST | Get detailed period info | Optional |
| 3 | `/timetable/getTodaySchedule` | POST | Get today's classes only | Optional |

---

## Implementation Notes

### Current State
- TimetableScreen.tsx uses **MOCK_TIMETABLE** hardcoded data
- Shows 6 days (Monday - Saturday)
- Displays periods with subject, teacher, time, room
- Highlights current period with "NOW" badge
- Shows break cards between periods 2-3 and 4-5

### What Needs to Change
1. Create `src/modules/timetable/services/timetableApi.ts`
2. Create `src/modules/timetable/hooks/useTimetable.ts`
3. Create `src/modules/timetable/types/timetable.types.ts`
4. Update TimetableScreen.tsx to use real API data
5. Add loading states and error handling
6. Add to `src/core/api/apiEndpoints.ts`
7. Add query key to `src/core/constants/keys.ts`

### Subject Color Mapping
The frontend currently maps subjects to colors. Options:
1. Keep color mapping in frontend (current approach)
2. Add `color` field in API response per subject
3. Create separate `/subjects/getSubjects` endpoint with colors

---

## Questions for Backend Team

1. Is timetable stored at class level or student level?
2. Can timetable change mid-week (special events)?
3. Should API return holidays/school events that cancel periods?
4. Is there a substitute teacher feature when regular teacher is absent?
5. Should we support different timetables for odd/even weeks?
6. What happens on half-days or special assembly days?

---

## File Structure (After Implementation)

```
src/modules/timetable/
├── screens/
│   └── TimetableScreen.tsx      # Main screen (update existing)
├── components/
│   ├── DaySelector.tsx          # Day tabs component
│   ├── PeriodCard.tsx           # Period display card
│   └── BreakCard.tsx            # Break display card
├── hooks/
│   └── useTimetable.ts          # React Query hook
├── services/
│   └── timetableApi.ts          # API calls
├── types/
│   └── timetable.types.ts       # TypeScript types
└── index.ts                     # Exports
```

---

## Sample API Call Flow

```
1. User opens Timetable screen
   ↓
2. useAuth provides selectedStudentId and student's CLASS_ID
   ↓
3. useTimetable hook calls getTimetable API
   ↓
4. API returns weekly schedule + breaks
   ↓
5. Screen displays data with day selector
   ↓
6. User switches day → no new API call (data already loaded)
   ↓
7. Pull-to-refresh → refetch timetable
```

---

## Caching Strategy

- **Cache Time:** 24 hours (timetable rarely changes)
- **Stale Time:** 1 hour
- **Refetch On:** App focus, pull-to-refresh, student change
- **Invalidate When:** Academic year changes, class promotion

