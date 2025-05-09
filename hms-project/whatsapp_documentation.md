POST
Send Message
{{apiBaseUrl}}/{{vendorUid}}/contact/send-message
Send Message

AUTHORIZATION
Bearer Token
Token
{{bearerToken}}

Body
raw (json)

json 

{
    // optional from phone number id is not given it will use default phone number id
    "from_phone_number_id": "{{fromPhoneNumberId}}",
    "phone_number": "{{phoneNumber}}",
    "message_body": "your message body",
    // if you want to create contact if it does not exist
    "contact": {
        "first_name" : "Johan",
        "last_name" : "Doe",
        "email" : "johndoe@doamin.com",
        "country" : "india",
        "language_code" : "en",
        "groups" : "examplegroup1,examplegroup2",
        "custom_fields" : {
            "BDay" : "2025-09-04"
        }

    }
}

Example Request: 

curl --location -g '{{apiBaseUrl}}/{{vendorUid}}/contact/send-message' \
--data-raw '{
    // optional from phone number id is not given it will use default phone number id
    "from_phone_number_id": "{{fromPhoneNumberId}}",
    "phone_number": "{{phoneNumber}}",
    "message_body": "your message body",
    // if you want to create contact if it does not exist
    "contact": {
        "first_name" : "Johan",
        "last_name" : "Doe",
        "email" : "johndoe@doamin.com",
        "country" : "india",
        "language_code" : "en",
        "groups" : "examplegroup1,examplegroup2",
        "custom_fields" : {
            "BDay" : "2025-09-04"
        }

    }
}'


POST Send Media Message

{{apiBaseUrl}}/{{vendorUid}}/contact/send-media-message
Send Message

AUTHORIZATION
Bearer Token
Token
{{bearerToken}}

Body raw (json)

{
    // optional from phone number id is not given it will use default phone number id
    "from_phone_number_id": "{{fromPhoneNumberId}}",
    "phone_number" : "{{phoneNumber}}",
    "media_type" : "document",
    "media_url" : "https://images.pexels.com/photos/276267/pexels-photo-276267.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "caption" : "your capation for image or video media types",
    "file_name" : "your file name for document",
    // if you want to create contact if it does not exist
    "contact": {
        "first_name" : "Johan",
        "last_name" : "Doe",
        "email" : "johndoe@doamin.com",
        "country" : "india",
        "language_code" : "en",
        "groups" : "examplegroup1,examplegroup2"
    }
}

Example Request: 

curl --location -g '{{apiBaseUrl}}/{{vendorUid}}/contact/send-media-message' \
--data-raw '{
    // optional from phone number id is not given it will use default phone number id
    "from_phone_number_id": "{{fromPhoneNumberId}}",
    "phone_number" : "{{phoneNumber}}",
    "media_type" : "document",
    "media_url" : "https://images.pexels.com/photos/276267/pexels-photo-276267.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "caption" : "your capation for image or video media types",
    "file_name" : "your file name for document",
    // if you want to create contact if it does not exist
    "contact": {
        "first_name" : "Johan",
        "last_name" : "Doe",
        "email" : "johndoe@doamin.com",
        "country" : "india",
        "language_code" : "en",
        "groups" : "examplegroup1,examplegroup2"
    }
}'

POST
Send Template Message
{{apiBaseUrl}}/{{vendorUid}}/contact/send-template-message
AUTHORIZATION
Bearer Token
Token
{{bearerToken}}

Body
raw (json)

{
    // optional from phone number id is not given it will use default phone number id
    "from_phone_number_id": "{{fromPhoneNumberId}}",
    "phone_number": "{{phoneNumber}}",
    "template_name" : "your_template_name",
    "template_language" : "en",
    "header_image" : "https://cdn.pixabay.com/photo/2015/01/07/15/51/woman-591576_1280.jpg",
    "header_video" : "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "header_document" : "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "header_document_name" : "{full_name}",
    "header_field_1" : "{full_name}",
    "location_latitude" : "22.22",
    "location_longitude" : "22.22",
    "location_name" : "{first_name}",
    "location_address" : "{country}",
    "field_1" : "{Age}",
    "field_2" : "{full_name}",
    "field_3" : "{first_name}",
    "field_4" : "{last_name}",
    "button_0" : "{email}",
    "button_1" : "{phone_number}",
    "copy_code" : "YourCode",
    // if you want to create contact if it does not exist
    "contact": {
        "first_name" : "Johan",
        "last_name" : "Doe",
        "email" : "johndoe@doamin.com",
        "country" : "india",
        "language_code" : "en",
        "groups" : "examplegroup1,examplegroup2"
    }
}

Example Request:

curl --location -g '{{apiBaseUrl}}/{{vendorUid}}/contact/send-template-message' \
--data-raw '{
    // optional from phone number id is not given it will use default phone number id
    "from_phone_number_id": "{{fromPhoneNumberId}}",
    "phone_number": "{{phoneNumber}}",
    "template_name" : "your_template_name",
    "template_language" : "en",
    "header_image" : "https://cdn.pixabay.com/photo/2015/01/07/15/51/woman-591576_1280.jpg",
    "header_video" : "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "header_document" : "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "header_document_name" : "{full_name}",
    "header_field_1" : "{full_name}",
    "location_latitude" : "22.22",
    "location_longitude" : "22.22",
    "location_name" : "{first_name}",
    "location_address" : "{country}",
    "field_1" : "{Age}",
    "field_2" : "{full_name}",
    "field_3" : "{first_name}",
    "field_4" : "{last_name}",
    "button_0" : "{email}",
    "button_1" : "{phone_number}",
    "copy_code" : "YourCode",
    // if you want to create contact if it does not exist
    "contact": {
        "first_name" : "Johan",
        "last_name" : "Doe",
        "email" : "johndoe@doamin.com",
        "country" : "india",
        "language_code" : "en",
        "groups" : "examplegroup1,examplegroup2"
    }
}'

POST
Create Contact
{{apiBaseUrl}}/{{vendorUid}}/contact/create
Send Message

AUTHORIZATION
Bearer Token
Token
{{bearerToken}}

Body
raw (json)

{
    "phone_number" : "{{phoneNumber}}",
    "first_name" : "Johan",
    "last_name" : "Doe",
    "email" : "johndoe@doamin.com",
    "country" : "india",
    "language_code" : "en",
    "groups" : "examplegroup1,examplegroup2",
    "custom_fields" : {
        "BDay" : "2025-09-01"
    }
}

Example Request:

curl --location -g '{{apiBaseUrl}}/{{vendorUid}}/contact/create' \
--data-raw '{
    "phone_number" : "{{phoneNumber}}",
    "first_name" : "Johan",
    "last_name" : "Doe",
    "email" : "johndoe@doamin.com",
    "country" : "india",
    "language_code" : "en",
    "groups" : "examplegroup1,examplegroup2",
    "custom_fields" : {
        "BDay" : "2025-09-01"
    }
}'

POST Update Contact

{{apiBaseUrl}}/{{vendorUid}}/contact/update/{{phoneNumber}}

Send Message

AUTHORIZATION
Bearer Token
Token
{{bearerToken}}

Body
raw (json)

{
    // only send required items to update sending blank values may remove existing values
    "first_name" : "Johan",
    "last_name" : "Doe",
    "email" : "johndoe@doamin.com",
    "country" : "91",
    "language_code" : "mr",
    "whatsapp_opt_out" : false,
    "enable_ai_bot": true,
    "groups" : "examplegroup1,examplegroup9",
    "custom_fields" : {
        "BDay" : "2025-09-04"
    }
}

Example Request:

curl --location -g '{{apiBaseUrl}}/{{vendorUid}}/contact/update/{{phoneNumber}}' \
--data-raw '{
    // only send required items to update sending blank values may remove existing values
    "first_name" : "Johan",
    "last_name" : "Doe",
    "email" : "johndoe@doamin.com",
    "country" : "91",
    "language_code" : "mr",
    "whatsapp_opt_out" : false,
    "enable_ai_bot": true,
    "groups" : "examplegroup1,examplegroup9",
    "custom_fields" : {
        "BDay" : "2025-09-04"
    }
}'