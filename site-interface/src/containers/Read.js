import React from "react";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { useFormFields } from "../libs/hooksLib";
import { onError } from "../libs/errorLib";
import "./Login.css";

export default function Read() {
    const [fields, handleFieldChange] = useFormFields({
        authenticatedUser: "",
        targetUser: ""
    });

    // Sends request to the readPassport route in the server, with the logged-in user and identity type taken from the session storage as the request body.
    // Parses the server response and displays either the full passport (if invoked by an admin), or a yes/no type of validation message to the screen (currently as an alert)
    async function handleSubmit(event) {
        event.preventDefault();

        try {
          let readResponse = await fetch('/readPassport', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    authenticatedUser: sessionStorage.getItem("username"),
                    authenticatedUserType: sessionStorage.getItem("userType"),
                    targetUser: fields.targetUser
                })
            });

            readResponse = await readResponse.text();

            // Parse the server response. If "true", display a positive validation message. If "false", display a negative validation message.
            // Otherwise, display all passport fields to the screen
            if (readResponse === "true") {
              alert(fields.targetUser + " has been vaccinated");
            } else if (readResponse === "false") {
              alert("No vaccine passport found for user: " + fields.targetUser);
            } else {
              let items = readResponse.split(",");
              items = JSON.parse(items);
              console.log('items: ', items);

              let id = items["ID"];
              let owner = items["Owner"];
              let vaccineBrand = items["VaccineBrand"];
              let vaccinationSite = items["VaccinationSite"];
              let vaccinationSite2 = items["VaccinationSite2"];
              let dateOfFirstDose = items["DateOfFirstDose"];
              let dateOfSecondDose = items["DateOfSecondDose"];

              // Create the alert for displaying vaccine passport to the screen
              let res = "User ID: " + id;
              res += "\n" + "Owner Name: " + owner;
              res += "\n" + "Vaccine Brand: " + vaccineBrand;
              res += "\n" + "Vaccination Site: " + vaccinationSite;
              if (vaccinationSite2 !== "") {
                res += "\n" + "Second Vaccination Site: " + vaccinationSite2;
              }
              
              res += "\n" + "Date of First Dose: " + dateOfFirstDose;

              if (dateOfSecondDose !== "") {
                res += "\n" + "Date of Second Dose: " + dateOfSecondDose;
              }           
              alert(res);
            }
        } catch (e) {
            onError(e);
        }
    }

  return (
    <div className="Read">
      <Form onSubmit={handleSubmit}>
        <Form.Group size="lg" controlId="targetUser">
          <Form.Label>User ID</Form.Label>
          <Form.Control
            autoFocus
            type="targetUser"
            value={fields.targetUser}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <LoaderButton
          block
          size="lg"
          type="submit"
        >
          Read Passport
        </LoaderButton>
      </Form>
    </div>
  );
}