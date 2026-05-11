import pandas as pd
import numpy as np
import random
import uuid

def generate_dataset(num_students=5000):
    np.random.seed(42)
    random.seed(42)

    data = []
    
    for _ in range(num_students):
        student_id = str(uuid.uuid4())
        
        # Features
        # Days since last login (0 to 60)
        days_since_last_login = np.random.randint(0, 60)
        
        # Average quiz score (0 to 100)
        avg_quiz_score = np.random.normal(70, 15)
        avg_quiz_score = max(0, min(100, avg_quiz_score))
        
        # Total watch time in minutes (0 to 1200)
        total_watch_time_mins = np.random.normal(500, 200)
        total_watch_time_mins = max(0, min(1200, total_watch_time_mins))
        
        # AI Tutor Interactions (0 to 50)
        ai_tutor_interactions = np.random.randint(0, 50)
        
        # Completed Lessons (0 to 30)
        completed_lessons = np.random.randint(0, 30)

        # Video Skip Rate (0 to 100)
        video_skip_rate = np.random.randint(0, 100)
        
        # Quiz success/failure
        quiz_success_rate = np.random.randint(0, 100)
        quiz_failure_rate = max(0, 100 - quiz_success_rate - np.random.randint(0, 20))

        # Logic to determine dropout risk (1 = Dropped out, 0 = Active)
        # We mathematically weight the features so the model has something logical to learn
        risk_score = 0
        
        # High inactivity increases risk significantly
        if days_since_last_login > 14:
            risk_score += 40
        if days_since_last_login > 30:
            risk_score += 30
            
        # Low quiz scores increase risk
        if avg_quiz_score < 50:
            risk_score += 25
            
        # High skip rate increases risk
        if video_skip_rate > 50:
            risk_score += 20
        if video_skip_rate > 80:
            risk_score += 20
            
        # High failure rate increases risk
        if quiz_failure_rate > 40:
            risk_score += 20
            
        # Low engagement increases risk
        if total_watch_time_mins < 100:
            risk_score += 15
        if ai_tutor_interactions == 0:
            risk_score += 5
            
        # Add some random noise so it's not perfectly deterministic
        risk_score += random.randint(-10, 10)
        
        # Threshold for dropping out
        dropped_out = 1 if risk_score > 60 else 0

        data.append({
            'student_id': student_id,
            'days_since_last_login': days_since_last_login,
            'avg_quiz_score': round(avg_quiz_score, 1),
            'total_watch_time_mins': round(total_watch_time_mins, 1),
            'ai_tutor_interactions': ai_tutor_interactions,
            'completed_lessons': completed_lessons,
            'video_skip_rate': video_skip_rate,
            'quiz_success_rate': quiz_success_rate,
            'quiz_failure_rate': quiz_failure_rate,
            'dropped_out': dropped_out
        })

    df = pd.DataFrame(data)
    df.to_csv('student_data.csv', index=False)
    print(f"Successfully generated 'student_data.csv' with {num_students} records.")
    print(df['dropped_out'].value_counts())

if __name__ == "__main__":
    generate_dataset()
