def forward_chaining_inference(text):
    text = text.lower()

    high_value_keywords = [
        'wallet', 'purse', 'cash', 'money', 'laptop', 'macbook',
        'phone', 'iphone', 'gold', 'watch'
    ]
    critical_doc_keywords = [
        'passport', 'id', 'visa', 'certificate', 'license',
        'aadhaar', 'pancard', 'voter'
    ]
    emotional_keywords = [
        'urgent', 'emergency', 'panic', 'please help', 'important', 'lost my life'
    ]

    urgency_level = "Low"
    reason = "Standard item."

    if any(word in text for word in high_value_keywords):
        urgency_level = "High"
        reason = "Contains high-value keywords (Potential Financial Loss)."

    if any(word in text for word in critical_doc_keywords):
        urgency_level = "Critical"
        reason = "Contains critical official document keywords (Identity Risk)."

    if any(word in text for word in emotional_keywords):
        if urgency_level != "Critical":
            urgency_level = "High"
            reason = "Detected high urgency/emotional language."

    return {
        "urgencyLevel": urgency_level,
        "inferenceReason": reason
    }
