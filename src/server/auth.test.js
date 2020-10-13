import * as server from 'server';

test("it does not start with a session", () => {
    expect(server.session).toBeFalsy();
})

test("it defaults when no session is available", () => {
    server.loadCredentials();
    expect(server.session).toBeFalsy();
});

test("it loads session from sessionStorage", () => {
    const theSession = "there's a session here";
    sessionStorage.setItem("session", theSession);
    server.loadCredentials();
    expect(server.session).toBe(theSession);
    server.clearSession();
    sessionStorage.clear();
});

test("it clears a defined session", () => {
    sessionStorage.setItem("session", "some session");
    localStorage.setItem("session", "some other session");
    server.loadCredentials();
    expect(server.session).toBeDefined();
    server.clearSession();
    expect(server.session).toBeFalsy();
    expect(sessionStorage.getItem("session")).toBeFalsy();
    expect(localStorage.getItem("session")).toBeFalsy();
});

test("it clears an undefined session", () => {
    expect(server.session).toBeFalsy();
    server.clearSession();
    expect(server.session).toBeFalsy();
});

test("it loads session from localStorage", () => {
    const theSession = "there's a session here";
    localStorage.setItem("session", theSession);
    server.loadCredentials();
    expect(server.session).toBe(theSession);
    server.clearSession();
    localStorage.clear();
});

test("it uses sessionStorage before localStorage", () => {
    const sessionSession = "the sessionStorage session";
    sessionStorage.setItem("session", sessionSession);
    localStorage.setItem("session", "the localstorage session");
    server.loadCredentials();
    expect(server.session).toBe(sessionSession);
    server.clearSession();
    localStorage.clear();
    sessionStorage.clear();
});

test("it updates the session variable", () => {
    server.saveSession("a session", false);
    expect(server.session).toBe("a session");
    sessionStorage.clear();
});

test("it updates only sessionStorage when not persisting", () => {
    server.saveSession("a session", false);
    expect(sessionStorage.getItem("session")).toBe("a session");
    expect(localStorage.getItem("session")).toBeFalsy();
    sessionStorage.clear();
});

test("it updates localStorage and sessionStorage when persisting", () => {
    server.saveSession("a session", true);
    expect(sessionStorage.getItem("session")).toBe("a session");
    expect(localStorage.getItem("session")).toBe("a session");
    sessionStorage.clear();
    localStorage.clear();
});
