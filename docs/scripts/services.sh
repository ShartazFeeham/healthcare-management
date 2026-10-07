# name:module-dir:port  (start order matters: infra first)
HC_SERVICES=(
  "discovery:DiscoveryServer:8761"
  "config:ConfigServer:8888"
  "account:Account:5100"
  "filestorage:FileStorage:5200"
  "integration:Integration:5300"
  "i18n:I18N:5400"
  "patients:PatientsData:7100"
  "doctors:DoctorData:7200"
  "medicines:Medicines:7300"
  "appointments:Appointment:7400"
  "community:Community:7500"
  "notifications:Notification:7600"
  "helpdesk:HelpDesk:7700"
  "cdss:CDSS:7800"
  "gateway:APIGateway:9999"
)
