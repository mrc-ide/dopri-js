module.exports = {
    "globals": {
        "ts-jest": {
            tsconfig: 'tsconfig.json',
            "diagnostics": {
                "warnOnly": false
            }
        }
    },
    "moduleFileExtensions": [
        "js",
        "json",
        "ts"
    ],
    "transform": {
        "^.+\\.ts?$": "ts-jest"
    },
    "coverageDirectory": "./coverage/",
    "collectCoverage": true,
    "coveragePathIgnorePatterns": [
        "/node_modules/"
    ]
};
