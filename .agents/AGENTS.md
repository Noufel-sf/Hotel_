# Agent Rules & Learnings for Hotel Search API

## Delivero IPRO Search Payload Specifications

When making availability requests to `POST /bookings/ipro/search`, the body **MUST** follow this exact format:

```json
{
    "SearchDetails": {
        "BookingDetails": {
            "CheckIn": "YYYY-MM-DD",
            "CheckOut": "YYYY-MM-DD",
            "Nationality": "dz",
            "Residency": "dz",
            "City": "34"
        },
        "Rooms": [
            {
                "Adult": "2",
                "children": 0,
                "Child": []
            }
        ],
        "GroupingHotel": true,
        "Product": "hotel",
        "CombinationRooms": false,
        "BoardingByRooms": false,
        "Filters": {
            "Source": "all"
        }
    }
}
```

### Critical Constraints discovered:
- **Case-Sensitivity**: Nationality and residency codes MUST be passed in **lowercase** (e.g. `"dz"`, `"tn"`, `"fr"`).
- **Parameters**: 
  - `CombinationRooms` MUST be `false`.
  - `BoardingByRooms` MUST be `false`.
  - `Filters.Source` MUST be `"all"`.
  - `City` MUST be a valid resolved location ID as string (e.g. `"34"` for Sousse, `"10"` for Hammamet).
