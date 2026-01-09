"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "./components/Button";
import { Container } from "./components/Container";
import { Branding } from "./components/Branding";
import { QRCodeDisplay } from "./features/pairing/QRCodeDisplay";
import { QRScanner } from "./features/pairing/QRScanner";
import { PairDeviceModal } from "./features/pairing/PairDeviceModal";

type PairState = "idle" | "waiting" | "connected";

export default function Home() {
    const [pairState, setPairState] = useState<PairState>("idle");
    const [roomId, setRoomId] = useState<string | null>(null);
    const [peerName, setPeerName] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const socket = useSocket((message) => {
        switch (message.type) {
            case "room-created":
                setRoomId(message.roomId);
                setPairState("waiting");
                break;

            case "room-joined":
                setRoomId(message.roomId);
                setPeerName("John’s Mac"); // MVP placeholder
                setPairState("connected");
                break;
        }
    });

    useEffect(() => {
        socket.connect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const createRoom = () => {
        socket.send({ type: "create-room" });
    };

    

    return (
        <main className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
            <Container>
                <div className="flex flex-col gap-12">
                    <Branding />

                    {/* Hero */}
                    <div className="space-y-3">
                        <h1 className="text-2xl font-semibold leading-tight text-[#0B0F1A]">
                            Send files.
                            <br />
                            No friction.
                        </h1>
                        <p className="text-sm text-neutral-600">
                            Pair securely and transfer files across any network.
                        </p>
                    </div>

                    {/* Pairing Card */}
                    <div className="w-full bg-white rounded-2xl p-8 shadow-sm space-y-6">
                        {pairState === "idle" && (
                            <>
                                <h2 className="text-lg font-medium text-[#0B0F1A]">
                                    Pair your device
                                </h2>

                                <Button
                                    onClick={createRoom}
                                    disabled={!socket.ready}
                                    className="w-full h-12 rounded-xl"
                                >
                                    Create pairing code
                                </Button>

                                <Button onClick={() => setIsModalOpen(true)}>Connect to a device</Button>
                            </>
                        )}

                        {pairState === "waiting" && (
                            <>
                                <h2 className="text-lg font-medium text-[#0B0F1A]">
                                    Waiting for device
                                </h2>

                                <div className="text-sm text-neutral-500">
                                    Pairing code
                                </div>

                                <div className="text-2xl font-mono tracking-widest text-[#0B0F1A]">
                                    {roomId}
                                </div>
                            </>
                        )}

                        {pairState === "connected" && (
                            <>
                                <h2 className="text-lg font-medium text-[#0B0F1A]">
                                    Connected
                                </h2>

                                <p className="text-sm text-neutral-600">
                                    Connected to {peerName}
                                </p>
                            </>
                        )}

                        {pairState === "waiting" && roomId && (
                            <>
                                <div className="mt-6">
                                    <QRCodeDisplay roomId={roomId} size={200} />
                                </div>
                            </>
                        )}

                        {pairState === "scanning" && (
                            <QRScanner 
                                onScan={(code) => {
                                    const roomId = code.replace("fluxsend://join/", ""); //parse the QR URL
                                    joinRoom(roomId);
                                }}
                            />
                        )}

                        <PairDeviceModal 
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onJoinRoom={(code) => {
                                socket.send({ type: "join-room", roomId: code });
                                setIsModalOpen(false);
                            }}
                        />
                    </div>
                </div>
            </Container>
        </main>
    );
}
