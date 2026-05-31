FROM eclipse-mosquitto:2.0

# Tạo password file cho MQTT authentication (đối phó nguy cơ 4.1.3)
# Username: souser, Password: sopassword
RUN mosquitto_passwd -b -c /mosquitto/config/passwd souser sopassword && \
    mosquitto_passwd -b    /mosquitto/config/passwd simulator simpassword

COPY mosquitto.conf /mosquitto/config/mosquitto.conf
