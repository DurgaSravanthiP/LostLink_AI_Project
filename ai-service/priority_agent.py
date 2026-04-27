# priority_agent.py
# Relates to Syllabus: Unit 1 (Intelligent Agents) & Unit 3 (Rule-Based System / Forward Chaining)
import sys
import json

def forward_chaining_inference(text):
    text = text.lower()
    
    # "Knowledge Base" of rules (Unit 3 Concept)
    high_value_keywords = ['wallet', 'purse', 'cash', 'money', 'laptop', 'macbook', 'phone', 'iphone', 'gold', 'watch']
    critical_doc_keywords = ['passport', 'id', 'visa', 'certificate', 'license', 'aadhaar', 'pancard', 'voter']
    emotional_keywords = ['urgent', 'emergency', 'panic', 'please help', 'important', 'lost my life']
    
    # Forward Chaining Logic: Apply rules to the facts (the text) to reach a conclusion
    urgency_level = "Low" # Default state
    reason = "Standard item."
    
    # Rule 1: High Value
    if any(word in text for word in high_value_keywords):
        urgency_level = "High"
        reason = "Contains high-value keywords (Potential Financial Loss)."
        
    # Rule 2: Critical Documents
    if any(word in text for word in critical_doc_keywords):
        urgency_level = "Critical"
        reason = "Contains critical official document keywords (Identity Risk)."
        
    # Rule 3: Emotional Urgency
    if any(word in text for word in emotional_keywords):
        # If it's already critical, keep it critical, otherwise high
        if urgency_level != "Critical":
            urgency_level = "High"
            reason = "Detected high urgency/emotional language."

    return {
        "urgencyLevel": urgency_level,
        "inferenceReason": reason
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_text = sys.argv[1]
        result = forward_chaining_inference(input_text)
        print(json.dumps(result))
    else:
        # Default for testing
        print(json.dumps({"error": "No text provided"}))
