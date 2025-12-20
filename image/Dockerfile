FROM tomcat:9.0-jdk11

RUN rm -rf /usr/local/tomcat/webapps/*

RUN mkdir -p /usr/local/tomcat/webapps/ROOT

COPY index.html /usr/local/tomcat/webapps/ROOT/
COPY style.css /usr/local/tomcat/webapps/ROOT/
COPY script.js /usr/local/tomcat/webapps/ROOT/

EXPOSE 8080

CMD ["catalina.sh", "run"]