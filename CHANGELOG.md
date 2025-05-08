# Changelog

## [Unreleased]

### Added
- E-signature Contract system:
  - Added contract model with model/manager relationships
  - Implemented contract creation and signing workflow
  - Created secure document viewing with iframe embedding
  - Added timestamp tracking for contract signing events
  - Comprehensive permission controls based on user roles
- KYC Review enhancements:
  - Added `reviewedAt` timestamp to track review completion time
  - Renamed `notes` field to `reason` for improved clarity
  - Added detailed review history with timestamps in admin UI
  - Enhanced admin dashboard for KYC verification management

### Changed
- Updated database schema to support contract relationships
- Added bidirectional relations between User and Contract models
- Improved user onboarding flow with contract signing step
- Enhanced model/manager relationship with formal agreements
- Improved KYC review flow with reason documentation
- Updated schema validations for KYC review operations
- Enhanced admin review interface with timestamp display
- Comprehensive test coverage for KYC review operations

### Fixed
- Standardized field naming for improved code consistency

## [1.0.0] - YYYY-MM-DD

// ... previous changelog entries ... 