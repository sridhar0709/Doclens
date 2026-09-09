import re
import uuid
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from ..config import get_settings

class OCRProvider(ABC):
    """Base interface for OCR Engines."""
    @abstractmethod
    def extract(self, file_bytes: bytes, filename: str, doc_type: str) -> Tuple[Dict[str, Any] | None, float]:
        """Extract text from the file bytes and return parsed fields and confidence score."""
        pass

class OCRSpaceProvider(OCRProvider):
    """OCR.space free-tier REST API implementation."""
    
    def __init__(self):
        self.url = "https://api.ocr.space/parse/image"
        
    def extract(self, file_bytes: bytes, filename: str, doc_type: str) -> Tuple[Dict[str, Any] | None, float]:
        settings = get_settings()
        if not settings.ocr_space_api_key:
            # Degrade gracefully if no API key configured
            return None, 0.0
            
        # Determine content type based on extension
        ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
        mime_type = "application/pdf" if ext == "pdf" else f"image/{ext}"
        if mime_type not in ("application/pdf", "image/png", "image/jpeg", "image/gif"):
            mime_type = "image/jpeg"  # Default fallback
            
        try:
            files = {"file": (filename, file_bytes, mime_type)}
            data = {
                "apikey": settings.ocr_space_api_key,
                "language": "eng",
                "isOverlayRequired": "false",
                "detectOrientation": "true",
                "scale": "true"
            }
            
            # Post request to OCR.space with a strict 10s timeout
            with httpx.Client(timeout=10.0) as client:
                response = client.post(self.url, data=data, files=files)
                
            if response.status_code != 200:
                return None, 0.0
                
            res_json = response.json()
            if res_json.get("OCRExitCode") != 1:
                return None, 0.0
                
            results = res_json.get("ParsedResults", [])
            if not results:
                return None, 0.0
                
            raw_text = results[0].get("ParsedText", "")
            if not raw_text:
                return None, 0.0
                
            # Perform basic regex extraction based on doc_type
            extracted = {"raw_text": raw_text}
            confidence = 0.8  # Default confidence for successful text extraction
            
            # Normalize raw text for matching
            text_upper = raw_text.upper()
            text_lower = raw_text.lower()
            
            if doc_type == "income_certificate":
                # Matches patterns like: Income: Rs. 150,000, Rs 120000, 95000 Rupees
                # We extract multiple matches and pick the one most likely to be annual income (ignoring years and pincodes)
                candidates = []
                # Pattern A: Label + Currency + Number
                for m in re.finditer(r'(?:income|salary|salery|earnings)\b.*?([0-9,]{5,8})', text_lower):
                    val = float(m.group(1).replace(",", ""))
                    if 10000 <= val <= 5000000:
                        candidates.append((val, 0.95))
                # Pattern B: Currency + Number
                for m in re.finditer(r'(?:rs|inr|rupees|rupee)\.?\s*([0-9,]{5,8})', text_lower):
                    val = float(m.group(1).replace(",", ""))
                    if 10000 <= val <= 5000000:
                        candidates.append((val, 0.90))
                # Pattern C: Generic 5-6 digit numbers (ignoring common years like 2023, 2024, 2026 and pincodes beginning with 1-9)
                for m in re.finditer(r'\b([0-9,]{5,7})\b', text_lower):
                    val = float(m.group(1).replace(",", ""))
                    if 10000 <= val <= 5000000:
                        is_pincode = (100000 <= val <= 999999) and (val % 1000 != 0)
                        if not is_pincode:
                            candidates.append((val, 0.85))

                if candidates:
                    candidates.sort(key=lambda x: x[1], reverse=True)
                    extracted["annual_income"] = candidates[0][0]
                    confidence = candidates[0][1]
                        
            elif doc_type == "aadhaar":
                # Aadhaar number is 12 digits: e.g. 1234 5678 9012 or 123456789012
                aadhaar_match = re.search(r'\b\d{4}\s\d{4}\s\d{4}\b', raw_text)
                if aadhaar_match:
                    extracted["aadhaar_number"] = aadhaar_match.group(0).replace(" ", "")
                    confidence = 0.95
                else:
                    aadhaar_match_raw = re.search(r'\b\d{12}\b', raw_text)
                    if aadhaar_match_raw:
                        extracted["aadhaar_number"] = aadhaar_match_raw.group(0)
                        confidence = 0.90
                
                # Extract Gender from Aadhaar
                gender_match = re.search(r'\b(male|female)\b', text_lower)
                if gender_match:
                    extracted["gender"] = gender_match.group(1)
                    
            elif doc_type == "caste_certificate":
                # Look for category keywords
                for cat in ("SC", "ST", "OBC", "General", "EWS"):
                    if re.search(rf'\b{cat}\b', text_upper):
                        extracted["social_category"] = cat.lower()
                        confidence = 0.95
                        break

            elif doc_type == "disability_certificate":
                # Look for disability keywords
                disability_type = "other"
                if any(x in text_lower for x in ("locomotor", "orthopedic", "handicap", "limb", "amputation", "paralysis")):
                    disability_type = "locomotor"
                elif any(x in text_lower for x in ("visual", "blind", "vision", "low vision")):
                    disability_type = "visual"
                elif any(x in text_lower for x in ("hearing", "deaf", "mute", "ear")):
                    disability_type = "hearing"
                elif any(x in text_lower for x in ("mental", "intellectual", "autism", "retardation", "brain")):
                    disability_type = "mental"
                
                extracted["disability_status"] = disability_type
                confidence = 0.90

            elif doc_type == "domicile_certificate":
                # Look for Indian state names in raw text
                states = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"]
                for s in states:
                    if re.search(r'\b' + re.escape(s) + r'\b', raw_text, re.IGNORECASE):
                        extracted["state"] = s
                        confidence = 0.95
                        break

            elif doc_type == "ration_card":
                # Look for BPL / APL / Antyodaya identifiers
                if any(x in text_upper for x in ("BPL", "BELOW POVERTY LINE", "ANTYODAYA", "AAY")):
                    extracted["has_bpl_card"] = True
                    confidence = 0.90
                elif any(x in text_upper for x in ("APL", "ABOVE POVERTY LINE")):
                    extracted["has_bpl_card"] = False
                    confidence = 0.90
                        
            return extracted, confidence
            
        except Exception:
            # Graceful degradation on timeout/OCR errors
            return None, 0.0
