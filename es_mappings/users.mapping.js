var user_mappings = {
    "properties": {
        "id":               { "type": "integer"  },
        "company_name":     { "type": "text"  },
        "user_logo":        { "type": "text" },
        "user_type":        { "type": "text" },
        "email":            { "type": "text" },
        "date_created":  {
            "type":"date",
            "format":"YYYY-MM-dd'T'HH:mm:ss.SSSZ"
        }
    }
};

module.exports = user_mappings;