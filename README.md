# Polling API

This project provides a simple polling API where users can create polls, vote on options, and retrieve poll results in real-time.

## API Endpoints

### Create a Poll

**POST** `/polls`

- **Request Body:**
  ```json
  {
    "question": "What is your favorite programming language?",
    "options": ["JavaScript", "Python", "Go"]
  }
  ```
- **Response:**
  ```json
  {
    "id": 1,
    "question": "What is your favorite programming language?",
    "created_at": "2025-02-16T12:00:00.000Z",
    "options": [
      { "id": 1, "text": "JavaScript", "votes": 0 },
      { "id": 2, "text": "Python", "votes": 0 },
      { "id": 3, "text": "Go", "votes": 0 }
    ]
  }
  ```

### Get All Polls

**GET** `/polls`

- **Response:**
  ```json
  [
    {
      "id": 1,
      "question": "What is your favorite programming language?",
      "created_at": "2025-02-16T12:00:00.000Z"
    }
  ]
  ```

### Get a Poll by ID

**GET** `/polls/:id`

- **Response:**
  ```json
  {
    "poll": {
      "id": 1,
      "question": "What is your favorite programming language?",
      "created_at": "2025-02-16T12:00:00.000Z"
    },
    "options": [
      { "id": 1, "text": "JavaScript", "votes": 0 },
      { "id": 2, "text": "Python", "votes": 0 },
      { "id": 3, "text": "Go", "votes": 0 }
    ]
  }
  ```

### Vote for an Option

**POST** `/options/:id/vote`

- **Response:**
  ```json
  { "id": 1, "text": "JavaScript", "votes": 1 }
  ```

### Delete a Poll

**DELETE** `/polls/:id`

- **Response:**
  ```json
  { "message": "Poll deleted successfully" }
  ```

## Database Schema

### Polls Table

```sql
CREATE TABLE polls (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Options Table

```sql
CREATE TABLE options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0
);
```
#
# Polling-App-Backend
