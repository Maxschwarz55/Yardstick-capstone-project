import "./App.css";
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
import GradientText from "./components/ui/gradient-text";
import {
  Field,
  Input,
  VStack,
  HStack,
  Container,
  Heading,
  Box,
  Card,
  Text,
} from "@chakra-ui/react";
import { Provider } from "./components/ui/provider";

function DOBPicker({ value, onChange }) {
  return (
    <Input
      type="date"
      variant="subtle"
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
          <Route path="/diagnostics" element={<Diagnostics />} />
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
    <Box minH="100vh" py={8}>
      <Container maxW="900px">
        {/* Header */}
        <VStack gap={8} align="stretch">
          <Box textAlign="center" py={4}>
            <GradientText className="text-4xl font-bold">
              Gatekeeper
            </GradientText>
            <Text mt={2} color="gray.500" fontSize="lg">
              Comprehensive background verification
            </Text>
          </Box>

          {/* Main Form */}
          <VStack gap={6} align="stretch">
            {/* Personal Information Section */}
            <Card.Root
              borderWidth="0.5px"
              borderColor="colorPalette.border"
              borderRadius="md"
              colorPalette="gray"
            >
              <Card.Header>
                <Heading size="lg" fontWeight="semibold">
                  Personal Information
                </Heading>
              </Card.Header>
              <Card.Body>
                <VStack gap={5} align="stretch">
                  <HStack gap={4}>
                    <Field.Root required flex={1}>
                      <Field.Label>First Name</Field.Label>
                      <Input
                        variant="subtle"
                        type="text"
                        placeholder="Walter"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root flex={1}>
                      <Field.Label>Middle Name</Field.Label>
                      <Input
                        type="text"
                        variant="subtle"
                        placeholder="Hartwell"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root required flex={1}>
                      <Field.Label>Last Name</Field.Label>
                      <Input
                        type="text"
                        placeholder="White"
                        variant="subtle"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </Field.Root>
                  </HStack>

                  <Field.Root maxW="300px">
                    <Field.Label>Date of Birth</Field.Label>
                    <DOBPicker value={dob} onChange={setDob} />
                  </Field.Root>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Location Section */}
            <Card.Root
              borderWidth="0.5px"
              borderColor="colorPalette.border"
              borderRadius="md"
              colorPalette="gray"
            >
              <Card.Header>
                <Heading size="lg" fontWeight="semibold">
                  Location
                </Heading>
              </Card.Header>
              <Card.Body>
                <VStack gap={5} align="stretch">
                  <Field.Root>
                    <Field.Label>Street Address</Field.Label>
                    <Input
                      type="text"
                      placeholder="308 Negra Arroyo Lane"
                      variant="subtle"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </Field.Root>

                  <HStack gap={4}>
                    <Field.Root flex={2}>
                      <Field.Label>City</Field.Label>
                      <Input
                        type="text"
                        placeholder="Albuquerque"
                        variant="subtle"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root flex={1}>
                      <Field.Label>State</Field.Label>
                      <Input
                        type="text"
                        placeholder="NM"
                        variant="subtle"
                        value={stateAddr}
                        onChange={(e) => setStateAddr(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root flex={1}>
                      <Field.Label>ZIP Code</Field.Label>
                      <Input
                        type="text"
                        placeholder="87104"
                        variant="subtle"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      />
                    </Field.Root>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Photo Verification Section */}
            <Card.Root
              borderWidth="0.5px"
              borderColor="colorPalette.border"
              borderRadius="md"
              colorPalette="gray"
            >
              <Card.Header>
                <Heading size="lg" fontWeight="semibold">
                  Photo Verification
                </Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>
                  Upload a photo for facial recognition matching (optional)
                </Text>
              </Card.Header>
              <Card.Body>
                <SelfieUploader onUploadComplete={setSelfieKey} />
              </Card.Body>
            </Card.Root>

            {/* Action Buttons */}
            <HStack gap={4} pt={4}>
              <Button
                variant="outline"
                flex={1}
                onClick={() => navigate("/diagnostics")}
                colorPalette="teal"
                border="1.5px solid"
                borderColor="colorPalette.border"
                color="colorPalette.fg"
                size="lg"
              >
                <TbHeartRateMonitor className="size-5" />
                Diagnostics
              </Button>

              <Button
                flex={2}
                onClick={handleClick}
                variant="subtle"
                colorPalette="green"
                bg="colorPalette.solid"
                size="lg"
              >
                <TbSearch className="size-5" />
                Run Background Check
              </Button>
            </HStack>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}