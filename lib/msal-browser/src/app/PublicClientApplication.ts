/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError, AuthResponse, AuthorizationCodeModule, AuthenticationParameters, INetworkModule, TokenResponse } from "msal-common";
import { BrowserStorage } from "../cache/BrowserStorage";
import { Configuration, buildConfiguration } from "./Configuration";
import { CryptoOps } from "../crypto/CryptoOps";

/**
 * A type alias for an authResponseCallback function.
 * {@link (authResponseCallback:type)}
 * @param authErr error created for failure cases
 * @param response response containing token strings in success cases, or just state value in error cases
 */
export type AuthCallback = (authErr: AuthError, response?: AuthResponse) => void;

/**
 * Key-Value type to support queryParams, extraQueryParams and claims
 */
export type StringDict = {[key: string]: string};

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication {

    // input configuration by developer/user
    private config: Configuration;

    // auth functions imported from msal-common module
    private authModule: AuthorizationCodeModule;

    // callback for error/token response
    private authCallback: AuthCallback = null;

    // Crypto interface implementation
    private browserCrypto: CryptoOps;

    // Storage interface implementation
    private browserStorage: BrowserStorage;

    // Network interface implementation
    private networkClient: INetworkModule;

    /**
     * @constructor
     * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
     *
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
     * - authority: the authority URL for your application.
     * - redirect_uri: the uri of your application registered in the portal.
     *
     * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
     * It is of the form https://login.microsoftonline.com/&lt;Enter_the_Tenant_Info_Here&gt;.
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * In Azure B2C, authority is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/&lt;policyName&gt;/
     *
     * @param {@link (Configuration:type)} configuration object for the MSAL PublicClientApplication instance
     */
    constructor(configuration: Configuration) {
        // Set the configuration
        this.config = buildConfiguration(configuration);

        // Initialize the crypto class
        this.browserCrypto = new CryptoOps();

        // Initialize the network module class
        this.networkClient = this.config.system.networkClient;

        // Initialize the browser storage class
        this.browserStorage = new BrowserStorage(this.config.auth.clientId, this.config.cache);

        // Create auth module
        this.authModule = new AuthorizationCodeModule({
            auth: this.config.auth,
            loggerOptions: {
                loggerCallbackInterface: this.config.system.loggerOptions.loggerCallback,
                piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled
            },
            cryptoInterface: this.browserCrypto,
            networkInterface: this.networkClient,
            storageInterface: this.browserStorage
        });
    }

    // #region Redirect Flow

    /**
     * Set the callback functions for the redirect flow to send back the success or error object.
     * @param {@link (AuthCallback:type)} authCallback - Callback which contains
     * an AuthError object, containing error data from either the server
     * or the library, depending on the origin of the error, or the AuthResponse object 
     * containing data from the server (returned with a null or non-blocking error).
     */
    handleRedirectCallback(authCallback: AuthCallback): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so 
     * any code that follows this function will not execute.
     * @param {@link (AuthenticationParameters:type)}
     */
    loginRedirect(request: AuthenticationParameters): void {
        this.authModule.createLoginUrl(request).then((urlNavigate) => {
            this.authModule.logger.info(urlNavigate);
        });
    }

    /**
     * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects 
     * the page, so any code that follows this function will not execute.
     * @param {@link (AuthenticationParameters:type)}
     *
     * To acquire only idToken, please pass clientId as the only scope in the Authentication Parameters
     */
    acquireTokenRedirect(request: AuthenticationParameters): void {
        throw new Error("Method not implemented.");
    }

    // #endregion

    // #region Popup Flow 

    /**
     * Use when initiating the login process via opening a popup window in the user's browser
     *
     * @param {@link (AuthenticationParameters:type)}
     *
     * @returns {Promise.<TokenResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    loginPopup(request: AuthenticationParameters): Promise<TokenResponse> {
        throw new Error("Method not implemented.");
    }

    /**
     * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
     * @param {@link AuthenticationParameters}
     *
     * To acquire only idToken, please pass clientId as the only scope in the Authentication Parameters
     * @returns {Promise.<TokenResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    acquireTokenPopup(request: AuthenticationParameters): Promise<TokenResponse> {
        throw new Error("Method not implemented.");
    }

    // #region Silent Flow

    /**
     * Use this function to obtain a token before every call to the API / resource provider
     *
     * MSAL return's a cached token when available
     * Or it send's a request to the STS to obtain a new token using a hidden iframe.
     *
     * @param {@link AuthenticationParameters}
     *
     * To renew idToken, please pass clientId as the only scope in the Authentication Parameters
     * @returns {Promise.<TokenResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     *
     */
    acquireTokenSilent(request: AuthenticationParameters): Promise<TokenResponse> {
        throw new Error("Method not implemented."); 
    }

    // #endregion

    // #region Getters and setters

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @returns {string} redirect URL
     *
     */
    public getRedirectUri(): string {
        return this.authModule.getRedirectUri();
    }

    /**
     * Use to get the post logout redirect uri configured in MSAL or null.
     * Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     *
     * @returns {string} post logout redirect URL
     */
    public getPostLogoutRedirectUri(): string {
        return this.authModule.getPostLogoutRedirectUri();
    }

    // #endregion
}
