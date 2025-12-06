import "./App.css";
import { RiSearchLine } from "react-icons/ri";
import { TbHeartRateMonitor, TbSearch } from "react-icons/tb";
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Results from "./Results";
import Diagnostics from "./Diagnostics";
import SelfieUploader from "./SelfieUploader";
import { Button } from "./components/ui/button";
import {
  Field,
  Input,
  Grid,
  GridItem,
  Container,
  Heading,
  Flex,
  Theme
} from "@chakra-ui/react";
import { Provider } from "./components/ui/provider";

function DOBPicker({ value, onChange }) {
  return (
    <Input
      type="date"
      variant="subtle"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-[40%]"
    />
  );
}

export default function App() {
  return (
    <Provider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/diagnostics" element={<Diagnostics />} />{" "}
          {/* new route */}
        </Routes>
      </Router>
    </Provider>
  );
}

function Home() {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");

  // NEW — address fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateAddr, setStateAddr] = useState("");
  const [zip, setZip] = useState("");
  const [selfieKey, setSelfieKey] = useState(null);
  const navigate = useNavigate();
  const handleClick = () => {
    if (firstName.trim() === "" || lastName.trim() === "") {
      alert("Please enter both first and last names.");
      return;
    }

    navigate("/results", {
      state: {
        firstName,
        middleName,
        lastName,
        dob,
        street,
        city,
        state: stateAddr,
        zip,
        selfieKey,
      },
    });
  };

  return (
    <>
      <Heading size="3xl" fontSize="3xl">
        Gatekeeper
      </Heading>

      <Container className="px-4xl max-h-[50vw]">
        <Heading
          size="2xl"
          fontSize="2xl"
          fontWeight="semibold"
          className="mb-lg"
        >
          Person Lookup
        </Heading>
        <Grid
          gridAutoRows="min-content"
          templateColumns="repeat(3, 1fr)"
          className="px-lg min-h-screen gap-y-lg"
        >
          <GridItem colSpan={3} className="flex gap-sm2 flex-col">
            <Heading
              size="xl"
              fontSize="xl"
              fontWeight="medium"
              className="mb-xs"
            >
              Personal Info
            </Heading>
            <Flex>
              <Field.Root required>
                <Field.Label>
                  First Name <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  variant="subtle"
                  type="text"
                  placeholder="Walter"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-[90%]"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Middle Name</Field.Label>
                <Input
                  type="text"
                  variant="subtle"
                  placeholder="Hartwell"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-[90%]"
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>
                  Last Name <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  type="text"
                  placeholder="White"
                  variant="subtle"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-[90%]"
                />
              </Field.Root>
            </Flex>
            <Field.Root>
              <Field.Label>Date of birth</Field.Label>
              <DOBPicker className="dob" value={dob} onChange={setDob} />
            </Field.Root>
          </GridItem>

          <GridItem colSpan={3} className="flex gap-sm2 flex-col">
            <Heading
              fontSize="xl"
              size="xl"
              fontWeight="medium"
              className="mb-xs"
            >
              Location
            </Heading>
            <Field.Root>
              <Field.Label>
                Address <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="text"
                placeholder="308 Negra Arroyo Lane"
                variant="subtle"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-[75%]"
              />
            </Field.Root>

            <Flex>
              <Field.Root>
                <Field.Label>
                  City <Field.RequiredIndicator />
                </Field.Label>

                <Input
                  type="text"
                  placeholder="Albuquerque"
                  variant="subtle"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-[90%]"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>
                  State <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  type="text"
                  placeholder="New Mexico"
                  variant="subtle"
                  value={stateAddr}
                  onChange={(e) => setStateAddr(e.target.value)}
                  className="w-[90%]"
                />
              </Field.Root>
            </Flex>

            <Field.Root>
              <Field.Label>
                Zip <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="text"
                placeholder="87104"
                variant="subtle"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-[30%]"
              />
            </Field.Root>
          </GridItem>
          <GridItem colSpan={3}>
            <Heading
              fontSize="xl"
              size="xl"
              fontWeight="medium"
              className="mb-sm2"
            >
              Upload a Selfie
            </Heading>
            <SelfieUploader onUploadComplete={setSelfieKey} />
          </GridItem>

          <GridItem colSpan={3}>
            <Flex justify="space-between">
              <Button
                variant="outline"
                className="w-[30%]"
                onClick={() => navigate("/diagnostics")}
                colorPalette="teal"
                border="1.5px solid"
                borderColor="colorPalette.border"
                color="colorPalette.fg"

              >
                <TbHeartRateMonitor />
                Diagnostics
              </Button>

              {/* <Button className="w-[40%]" onClick={handleClick} bg="green.solid"> */}
              <Button
                className="w-[40%]"
                onClick={handleClick}
                variant="subtle"
                colorPalette="green"
                bg="colorPalette.solid"
              >
                <TbSearch />
                Run Search
              </Button>
            </Flex>
          </GridItem>
        </Grid>
      </Container>
    </>
  );
}
